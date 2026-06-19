from PIL import Image
import os

img_dir = 'public/images'
large = {'about-hero','about-mission','about-team','contact-hero','cta-office','features-hero','hero-global','hero-main','login-bg','pricing-hero','signup-bg','features-compliance','features-reports','feature-forex','feature-transfers','feature-mobile','about-africa','feature-security'}
total_before = 0
total_after = 0

for f in sorted(os.listdir(img_dir)):
    if not f.endswith('.jpg'):
        continue
    path = os.path.join(img_dir, f)
    size_before = os.path.getsize(path)
    total_before += size_before
    
    img = Image.open(path)
    max_w = 1920 if f.replace('.jpg','') in large else 800
    if img.width > max_w:
        ratio = max_w / img.width
        img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    img.save(path, 'JPEG', quality=82, optimize=True)
    
    size_after = os.path.getsize(path)
    total_after += size_after
    pct = (1 - size_after / size_before) * 100
    print(f'{f}: {size_before//1024}KB -> {size_after//1024}KB ({pct:.0f}%)')

print(f'\nTotal: {total_before//1024}KB -> {total_after//1024}KB ({(1-total_after/total_before)*100:.0f}% smaller)')
