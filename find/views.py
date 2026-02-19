import os
import cv2
import uuid
import traceback
import numpy as np
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
from PIL import Image
from .sift_utils import computeKeypointsAndDescriptors
from .models import PhotoLost, User, UserToken


def verify_token(request):
    token = request.META.get('HTTP_AUTHORIZATION')
    if not token:
        return None, JsonResponse({'code': 401, 'msg': '未提供认证token'}, status=401)

    try:
        token_obj = UserToken.objects.get(token=token)
        return token_obj.user, None
    except UserToken.DoesNotExist:
        return None, JsonResponse({'code': 401, 'msg': '无效的token'}, status=401)


def validate_photo(request):
    if 'photo' not in request.FILES:
        return None, JsonResponse({'code': 400, 'msg': '未上传照片'}, status=400)

    photo_file = request.FILES['photo']

    if not photo_file.name:
        return None, JsonResponse({'code': 400, 'msg': '照片文件名为空'}, status=400)

    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    file_ext = os.path.splitext(photo_file.name)[1].lower()
    if file_ext not in allowed_extensions:
        return None, JsonResponse({'code': 400, 'msg': '不支持的图片格式'}, status=400)

    return photo_file, None


def pic_check(photo_file):
    temp_path = None
    try:
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, photo_file.name)

        with open(temp_path, 'wb+') as destination:
            for chunk in photo_file.chunks():
                destination.write(chunk)

        file_size = os.path.getsize(temp_path)
        if file_size == 0:
            return [0, "null"]

        pil_img = Image.open(temp_path)
        max_size = 1200
        if pil_img.width > max_size or pil_img.height > max_size:
            scale = max_size / max(pil_img.width, pil_img.height)
            new_width = int(pil_img.width * scale)
            new_height = int(pil_img.height * scale)
            pil_img = pil_img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        if pil_img.mode == 'RGBA':
            pil_img = pil_img.convert('RGB')

        uploaded_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        uploaded_gray = cv2.cvtColor(uploaded_img, cv2.COLOR_BGR2GRAY)

        kp1, desc1 = computeKeypointsAndDescriptors(uploaded_gray)

        if kp1 is None or desc1 is None:
            kp1 = []
            desc1 = None

        if len(kp1) == 0 or desc1 is None or (hasattr(desc1, '__len__') and len(desc1) == 0):
            orb = cv2.ORB_create(nfeatures=1000)
            kp1 = orb.detect(uploaded_gray, None)
            kp1, desc1 = orb.compute(uploaded_gray, kp1)

            if len(kp1) == 0 or desc1 is None:
                return [0, "null"]

        database_images = get_database_images()
        if not database_images:
            return [0, "null"]

        best_match_path = None
        max_similarity = 0

        for product in database_images:
            image_url = product.get("image", "")
            if not image_url:
                continue

            db_img_path = os.path.join(settings.MEDIA_ROOT, image_url)
            if not os.path.exists(db_img_path):
                continue

            try:
                db_pil_img = Image.open(db_img_path)

                if db_pil_img.width > max_size or db_pil_img.height > max_size:
                    scale = max_size / max(db_pil_img.width, db_pil_img.height)
                    new_width = int(db_pil_img.width * scale)
                    new_height = int(db_pil_img.height * scale)
                    db_pil_img = db_pil_img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                if db_pil_img.mode == 'RGBA':
                    db_pil_img = db_pil_img.convert('RGB')

                db_img = cv2.cvtColor(np.array(db_pil_img), cv2.COLOR_RGB2BGR)
                db_gray = cv2.cvtColor(db_img, cv2.COLOR_BGR2GRAY)

                kp2, desc2 = computeKeypointsAndDescriptors(db_gray)

                if kp2 is None or desc2 is None:
                    orb = cv2.ORB_create(nfeatures=1000)
                    kp2 = orb.detect(db_gray, None)
                    kp2, desc2 = orb.compute(db_gray, kp2)

                if len(kp2) == 0 or desc2 is None or (hasattr(desc2, '__len__') and len(desc2) == 0):
                    continue

                similarity = calculate_similarity(desc1, desc2)

                if similarity > max_similarity:
                    max_similarity = similarity
                    best_match_path = image_url

            except Exception as e:
                print(f"处理数据库图片失败: {e}")
                continue

        similarity_threshold = 0.1
        if max_similarity > similarity_threshold:
            return [1, best_match_path]
        else:
            return [0, "null"]

    except Exception as e:
        print(f"pic_check函数出错: {str(e)}")
        return [0, "null"]
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"删除临时文件失败: {e}")


def get_database_images():
    database_images = list(PhotoLost.objects.values('id', 'image', 'created_at'))
    return database_images


def calculate_similarity(desc1, desc2):
    try:
        if desc1 is None or desc2 is None or len(desc1) == 0 or len(desc2) == 0:
            print("描述符为空，无法计算相似度")
            return 0

        if isinstance(desc1, list):
            desc1 = np.array(desc1, dtype=np.float32)
        if isinstance(desc2, list):
            desc2 = np.array(desc2, dtype=np.float32)

        if len(desc1.shape) != 2 or len(desc2.shape) != 2:
            print(
                f"描述符维度不正确: desc1={desc1.shape if hasattr(desc1, 'shape') else 'N/A'}, desc2={desc2.shape if hasattr(desc2, 'shape') else 'N/A'}")
            return 0

        bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)

        matches = bf.knnMatch(desc1, desc2, k=2)

        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

        min_features = min(len(desc1), len(desc2))
        if min_features > 0:
            similarity = len(good_matches) / min_features
            print(f"良好匹配数: {len(good_matches)}, 特征点数: {len(desc1)}/{len(desc2)}, 相似度: {similarity:.4f}")
            return similarity
        else:
            return 0

    except Exception as e:
        print(f"相似度计算出错: {e}")
        traceback.print_exc()
        return 0


def upload_photo(request):
    if request.method != 'POST':
        return JsonResponse({'code': 400, 'msg': '请求方法错误'}, status=400)

    user, error_response = verify_token(request)
    if error_response:
        return error_response

    photo_file, error_response = validate_photo(request)
    if error_response:
        return error_response

    try:
        photo_lost = PhotoLost.objects.create(
            image=photo_file,
            phone=user.phone
        )
        return JsonResponse({
            'code': 200,
            'msg': '上传成功',
            'data': {
                'id': photo_lost.id,
                'image_path': photo_lost.image.name,
                'phone': photo_lost.phone,
                'created_at': photo_lost.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        })
    except Exception as e:
        print(f"上传照片失败: {str(e)}")
        return JsonResponse({'code': 500, 'msg': f'上传失败: {str(e)}'}, status=500)


def compare_photo(request):
    if request.method != 'POST':
        return JsonResponse({'code': 400, 'msg': '请求方法错误'}, status=400)

    user, error_response = verify_token(request)
    if error_response:
        return error_response

    photo_file, error_response = validate_photo(request)
    if error_response:
        return error_response

    try:
        result = pic_check(photo_file)

        if result[0] == 1:
            matched_path = result[1]
            photo_lost = PhotoLost.objects.get(image=matched_path)
            response_data = {
                'code': 200,
                'msg': '比对成功',
                'data': {
                    'id': photo_lost.id,
                    'image_path': photo_lost.image.name,
                    'phone': photo_lost.phone,
                    'created_at': photo_lost.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }
            }
            photo_lost.delete()
            return JsonResponse(response_data)
        else:
            return JsonResponse({'code': 400, 'msg': '比对失败'})
    except Exception as e:
        print(f"比对照片失败: {str(e)}")
        return JsonResponse({'code': 500, 'msg': f'比对失败: {str(e)}'}, status=500)


def user_register(request):
    if request.method != 'POST':
        return JsonResponse({'code': 405, 'msg': '仅支持 POST 请求'})

    username = request.POST.get('username')
    password = request.POST.get('password')
    phone_number = request.POST.get('phone_number')

    if not username or not password or not phone_number:
        return JsonResponse({'code': 400, 'msg': '用户名、密码和手机号不能为空'})

    if len(phone_number) != 11:
        return JsonResponse({'code': 400, 'msg': '手机号格式不正确'})

    if User.objects.filter(username=username).exists():
        return JsonResponse({'code': 400, 'msg': '用户名已存在'})

    if User.objects.filter(phone=phone_number).exists():
        return JsonResponse({'code': 400, 'msg': '手机号已被注册'})

    hashed_password = make_password(password)

    user = User.objects.create(
        username=username,
        password=hashed_password,
        phone=phone_number
    )

    token = str(uuid.uuid4()).replace('-', '')
    UserToken.objects.create(user=user, token=token)

    return JsonResponse({'code': 200, 'msg': '注册成功', 'token': token})


def user_login(request):
    if request.method != 'POST':
        return JsonResponse({'code': 405, 'msg': '仅支持 POST 请求'})

    username = request.POST.get('username')
    password = request.POST.get('password')

    if not username or not password:
        return JsonResponse({'code': 400, 'msg': '用户名或密码不能为空'})

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'code': 401, 'msg': '用户不存在'})

    if not check_password(password, user.password):
        return JsonResponse({'code': 401, 'msg': '用户名或密码错误'})

    token_obj, _ = UserToken.objects.update_or_create(
        user=user,
        defaults={'token': str(uuid.uuid4()).replace('-', '')}
    )

    return JsonResponse({'code': 200, 'msg': '登录成功', 'token': token_obj.token})
