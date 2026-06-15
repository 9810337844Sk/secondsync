-- ============================================================
--  Second Sync — Seed Data (Development Only)
--  Run AFTER schema.sql to populate sample listings.
--  DO NOT run in production.
-- ============================================================

-- NOTE: Replace <your-user-id> with a real UUID from auth.users
-- to test listings as a logged-in user.

-- Sample listings (images from Cloudinary or any CDN)
insert into public.listings
  (title, title_np, category, price, original_price, condition, location, phone, description, images, seller_name, seller_email, is_active)
values
  (
    'Vintage Pentax K1000 Film Camera',
    'पुरानो पेन्ट्याक्स फिल्म क्यामेरा',
    'electronics',
    8500,
    14000,
    'Excellent',
    'Thamel, Kathmandu',
    '+977 9841000001',
    'Well-loved 35mm SLR in working condition. Comes with original strap and a roll of unopened film.',
    ARRAY['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800'],
    'Ashish Karki',
    'ashish@example.com',
    true
  ),
  (
    'Trek Mountain Bike 27.5"',
    'ट्रेक माउन्टेन बाइक',
    'vehicles',
    42000,
    68000,
    'Like New',
    'Pokhara',
    '+977 9841000002',
    'Ridden a handful of times around Phewa. Hydraulic discs, recently tuned.',
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    'Mega Paudel',
    'mega@example.com',
    true
  ),
  (
    'MacBook Pro 13" (2019, 16GB)',
    'म्याकबुक प्रो १३ इन्च',
    'electronics',
    78000,
    145000,
    'Excellent',
    'Baluwatar, Kathmandu',
    '+977 9841000003',
    'Single owner, kept in sleeve. Battery health 91%. Original charger included.',
    ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
    'Rahul Shah',
    'rahul@example.com',
    true
  ),
  (
    'Handwoven Dhaka Topi (Palpali)',
    'पाल्पाली ढाका टोपी',
    'fashion',
    950,
    null,
    'Like New',
    'Tansen, Palpa',
    '+977 9841000004',
    'Authentic Palpali Dhaka, woven by a family artisan. Worn once at a wedding.',
    ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800'],
    'Swarup Ghorsaine',
    'swarup@example.com',
    true
  ),
  (
    'Solid Teak Wood Chair',
    'सागको काठको कुर्सी',
    'furniture',
    5500,
    null,
    'Good',
    'Bhaktapur',
    '+977 9841000005',
    'Hand-carved Newari style chair. Minor scuffs on the legs which add character.',
    ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
    'Dilasha Basnet',
    'dilasha@example.com',
    true
  );
