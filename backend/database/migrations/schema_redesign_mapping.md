# Schema mapping (old -> redesigned)

## Giữ và chuẩn hóa
- `users` -> `users` (giữ), thêm các bảng RBAC: `roles`, `permissions`, `role_permissions`, `user_roles`.
- `comics` -> `comics` (giữ), thêm metadata crawler và chuẩn hóa index.
- `chapters` -> `chapters` (giữ), bổ sung `source_url`, `source_chapter_id`.
- `categories`, `comic_categories`, `countries` -> giữ và ràng buộc FK/index rõ ràng.
- `favorites`, `likes`, `reading_history`, `comments`, `comment_likes`, `notifications`, `payments` -> giữ để tương thích code hiện tại.

## Bảng mới
- Auth: `user_auth_providers`.
- Crawler: `crawl_sources`, `crawl_jobs`, `crawl_items`, `crawl_item_story_links`.
- Payment: `payment_providers`, `payment_transactions`, `vip_plans`, `vip_subscriptions`.
- AI: `story_summaries`, `chapter_summaries`, `ai_usage_logs`.

## Bảng cũ không cần giữ dữ liệu
- Tất cả bảng cũ bị drop khi chạy `migrate:reset-redesign`.
- Không có bước migrate dữ liệu theo yêu cầu reset sạch.
