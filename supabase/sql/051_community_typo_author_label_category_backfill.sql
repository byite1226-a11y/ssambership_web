-- 커뮤니티 author_label 오타(쉘버십→쌤버십) 및 category null 백필
-- Supabase SQL Editor에서 직접 실행하세요. idempotent.

update public.community_posts
set author_label = replace(author_label, '쉘버십', '쌤버십')
where author_label like '%쉘버십%';

update public.shortform_posts
set author_label = replace(author_label, '쉘버십', '쌤버십')
where author_label like '%쉘버십%';

update public.comments
set author_label = replace(author_label, '쉘버십', '쌤버십')
where author_label like '%쉘버십%';

update public.community_comments
set author_label = replace(author_label, '쉘버십', '쌤버십')
where author_label like '%쉘버십%';

-- category 미입력 게시글 → '자유' 슬러그
update public.community_posts
set category = 'free'
where category is null or trim(category) = '';
