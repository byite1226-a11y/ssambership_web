-- 051 community comments 오타 백필 + community_posts category 기본값 (실제 존재 컬럼만)

update public.community_comments
set author_label = replace(author_label, '쉘버십', '쌤버십')
where author_label like '%쉘버십%';

update public.community_posts
set category = 'free'
where category is null or trim(category) = '';
