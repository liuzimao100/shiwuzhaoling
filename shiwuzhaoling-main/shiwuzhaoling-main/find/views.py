import os
import cv2
import uuid
import numpy as np
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
from PIL import Image
from .models import PhotoLost, User, UserToken


def verify_token(request):
    raw_token = request.META.get('HTTP_AUTHORIZATION')
    if not raw_token:
        return None, JsonResponse({'code': 401, 'msg': '未提供认证token'}, status=401)

    if raw_token.startswith('Token '):
        token = raw_token.split(' ', 1)[1].strip()
    else:
        token = raw_token.strip()

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
        print("=" * 50)
        print("[图片对比] 开始处理")
        
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, photo_file.name)
        print(f"[图片对比] 临时文件路径: {temp_path}")

        with open(temp_path, 'wb+') as destination:
            for chunk in photo_file.chunks():
                destination.write(chunk)

        file_size = os.path.getsize(temp_path)
        print(f"[图片对比] 文件大小: {file_size} bytes")
        if file_size == 0:
            print("[图片对比] 文件为空，返回失败")
            return [0, "null"]

        pil_img = Image.open(temp_path)
        print(f"[图片对比] 原始图片尺寸: {pil_img.width}x{pil_img.height}")
        
        max_size = 600
        if pil_img.width > max_size or pil_img.height > max_size:
            scale = max_size / max(pil_img.width, pil_img.height)
            new_width = int(pil_img.width * scale)
            new_height = int(pil_img.height * scale)
            pil_img = pil_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"[图片对比] 缩放后尺寸: {new_width}x{new_height}")

        if pil_img.mode == 'RGBA':
            pil_img = pil_img.convert('RGB')
            print("[图片对比] 转换RGBA为RGB")

        uploaded_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        uploaded_gray = cv2.cvtColor(uploaded_img, cv2.COLOR_BGR2GRAY)
        print("[图片对比] 图片预处理完成")

        print("[图片对比] 开始提取上传图片的特征点...")
        sift = cv2.SIFT_create(nfeatures=500)
        kp1, desc1 = sift.detectAndCompute(uploaded_gray, None)

        if desc1 is None or len(kp1) == 0:
            print("[图片对比] 无法提取特征点，返回失败")
            return [0, "null"]

        print(f"[图片对比] 上传图片特征点数量: {len(kp1)}")

        database_images = get_database_images()
        print(f"[图片对比] 数据库中共有 {len(database_images)} 张图片")
        if not database_images:
            print("[图片对比] 数据库为空，返回失败")
            return [0, "null"]

        best_match_path = None
        max_similarity = 0
        best_match_id = None
        
        bf = cv2.BFMatcher(cv2.NORM_L2)

        print("[图片对比] 开始遍历数据库图片进行对比...")
        for idx, product in enumerate(database_images):
            image_url = product.get("image", "")
            if not image_url:
                continue

            db_img_path = os.path.join(settings.MEDIA_ROOT, image_url)
            if not os.path.exists(db_img_path):
                print(f"[图片对比] 图片{idx+1}: 文件不存在 - {db_img_path}")
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

                kp2, desc2 = sift.detectAndCompute(db_gray, None)

                if desc2 is None or len(kp2) == 0:
                    print(f"[图片对比] 图片{idx+1}(ID:{product.get('id')}): 无法提取特征点，跳过")
                    continue

                matches = bf.knnMatch(desc1, desc2, k=2)
                
                good_matches = []
                for match_pair in matches:
                    if len(match_pair) == 2:
                        m, n = match_pair
                        if m.distance < 0.75 * n.distance:
                            good_matches.append(m)
                
                min_features = min(len(kp1), len(kp2))
                if min_features > 0:
                    similarity = len(good_matches) / min_features
                else:
                    similarity = 0
                    
                print(f"[图片对比] 图片{idx+1}(ID:{product.get('id')}): 特征点={len(kp2)}, 匹配={len(good_matches)}, 相似度={similarity:.4f}")

                if similarity > max_similarity:
                    max_similarity = similarity
                    best_match_path = image_url
                    best_match_id = product.get('id')

            except Exception as e:
                print(f"[图片对比] 图片{idx+1}处理失败: {e}")
                continue

        print("[图片对比] 对比完成")
        print(f"[图片对比] 最高相似度: {max_similarity:.4f}")
        print(f"[图片对比] 最佳匹配ID: {best_match_id}")
        print(f"[图片对比] 最佳匹配路径: {best_match_path}")
        
        similarity_threshold = 0.1
        if max_similarity > similarity_threshold:
            print(f"[图片对比] 结果: 匹配成功 (相似度 {max_similarity:.4f} > 阈值 {similarity_threshold})")
            print("=" * 50)
            return [1, best_match_path]
        else:
            print(f"[图片对比] 结果: 匹配失败 (相似度 {max_similarity:.4f} <= 阈值 {similarity_threshold})")
            print("=" * 50)
            return [0, "null"]

    except Exception as e:
        print(f"[图片对比] 发生错误: {str(e)}")
        print("=" * 50)
        return [0, "null"]
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                print(f"[图片对比] 已删除临时文件: {temp_path}")
            except Exception as e:
                print(f"[图片对比] 删除临时文件失败: {e}")


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
            media_base = request.build_absolute_uri(settings.MEDIA_URL)
            image_url = media_base + photo_lost.image.name if photo_lost.image else ''
            response_data = {
                'code': 200,
                'msg': '比对成功',
                'data': {
                    'id': photo_lost.id,
                    'image_url': image_url,
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


def get_items(request):
    if request.method != 'GET':
        return JsonResponse({'code': 400, 'msg': '请求方法错误'}, status=400)

    items = PhotoLost.objects.all().order_by('-created_at').values('id', 'image', 'created_at')

    media_base = request.build_absolute_uri(settings.MEDIA_URL)

    from django.utils import timezone

    data = []
    for item in items:
        image_path = item['image'] or ''
        image_url = media_base + image_path if image_path else ''
        created_at = item['created_at']
        if created_at:
            if timezone.is_aware(created_at):
                created_at = timezone.localtime(created_at)
            created_at_str = created_at.strftime('%Y-%m-%d %H:%M:%S')
        else:
            created_at_str = ''
        data.append({
            'id': item['id'],
            'image_url': image_url,
            'created_at': created_at_str,
        })

    return JsonResponse({'code': 200, 'msg': '获取成功', 'data': data})


def get_my_items(request):
    if request.method != 'GET':
        return JsonResponse({'code': 400, 'msg': '请求方法错误'}, status=400)

    user, error_response = verify_token(request)
    if error_response:
        return error_response

    items = PhotoLost.objects.filter(phone=user.phone).order_by('-created_at').values('id', 'image', 'created_at')

    media_base = request.build_absolute_uri(settings.MEDIA_URL)

    from django.utils import timezone

    data = []
    for item in items:
        image_path = item['image'] or ''
        image_url = media_base + image_path if image_path else ''
        created_at = item['created_at']
        if created_at:
            if timezone.is_aware(created_at):
                created_at = timezone.localtime(created_at)
            created_at_str = created_at.strftime('%Y-%m-%d %H:%M:%S')
        else:
            created_at_str = ''
        data.append({
            'id': item['id'],
            'image_url': image_url,
            'created_at': created_at_str,
        })

    return JsonResponse({'code': 200, 'msg': '获取成功', 'data': data})
