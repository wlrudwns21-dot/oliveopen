-- ===== 회원 그룹 (기존 pk 유지: 1=Administrator, 2=Guest, 5=CustomerService) =====
insert into public.member_group (pk, name, description) overriding system value values
 (1,'Administrator','전체 권한 (마스터)'),
 (2,'Guest','일반 고객'),
 (3,'Manager','관리자 — 회원 관리 제외'),
 (4,'Operator','운영자 — 회원·쿠폰 관리 제외'),
 (5,'CustomerService','고객센터 — 반품 처리');
select setval(pg_get_serial_sequence('public.member_group','pk'), 10);

insert into public.member_group_permission (member_group_pk, kind, resource, is_allowed) values
 (1,'ADMIN','SYSTEM',true),
 (3,'ADMIN','SYSTEM',true),
 (3,'MANAGE_MEMBERS',null,false),
 (4,'ADMIN','SYSTEM',true),
 (4,'MANAGE_MEMBERS',null,false),
 (4,'MANAGE_COUPONS',null,false),
 (5,'CREATE_RETURN',null,true);

-- ===== 계정 (비밀번호 = sha256 hex) =====
insert into public.member (id, password, nick, grade, extra) values
 ('admin',    encode(extensions.digest(convert_to('admin1234','UTF8'),'sha256'),'hex'),  'Admin',  'VIP',   '{}'),
 ('manager',  encode(extensions.digest(convert_to('manager1234','UTF8'),'sha256'),'hex'),'매니저', 'GREEN', '{}'),
 ('operator', encode(extensions.digest(convert_to('operator1234','UTF8'),'sha256'),'hex'),'운영자','GREEN', '{}'),
 ('olive',    encode(extensions.digest(convert_to('olive1234','UTF8'),'sha256'),'hex'),  '올리브', 'GOLD',
   '{"email":"olive@oliveopen.kr","phone":"010-1234-5678","address":"서울 송파구 가락시장로 100","detail_address":"101동 1001호"}');

insert into public.member_group_mapping (local_member_pk, local_member_group_pk)
select m.pk, g.gpk from (values ('admin',1),('manager',3),('operator',4),('olive',2)) as g(mid,gpk)
join public.member m on m.id = g.mid;

insert into public.member_address (member_pk, label, recipient, phone, zipcode, address, detail_address, is_default)
select pk, '우리집', '올리브', '010-1234-5678', '05699', '서울 송파구 가락시장로 100', '101동 1001호', true
from public.member where id='olive';

-- ===== 카테고리 =====
insert into public.category (pk, parent_pk, name, slug, sort_order, is_active) overriding system value
values (1, null, '과일', 'fruits', 0, true);
select setval(pg_get_serial_sequence('public.category','pk'), 10);

-- ===== 상품 =====
insert into public.product (category_pk, sku, name, description, price, status, origin, sub_title, original_price, emoji, rating, review_count, badges, is_md_pick, sort_order) values
 (1,'gamgyul','제주 노지 감귤','한 입 베어 물면 진한 단맛이 그냥 터져요',16900,'active','국내 · 제주','한 입 베어 물면 진한 단맛이 그냥 터져요',21000,'🍊',4.9,1284,'["새벽 경매 직송","당도 선별","산지직송"]',true,1),
 (1,'blueberry','국내산 생블루베리','입안에서 톡 터지는 오늘의 건강한 한 알',18900,'active','국내산','입안에서 톡 터지는 오늘의 건강한 한 알',23000,'🫐',4.8,642,'["새벽 경매 직송","2차 정밀 선별","유통 마진 제로"]',true,2),
 (1,'tomato','대추방울토마토','당도 꽉 찬 아삭한 한 입',9900,'active','국내산','당도 꽉 찬 아삭한 한 입',12900,'🍅',4.7,415,'["새벽 경매 직송","2차 정밀 선별","압도적 가성비"]',false,3),
 (1,'mango','태국산 로얄 황금망고','나무에서 영근 그대로의 달콤함',24900,'active','태국 · 남독마이','나무에서 영근 그대로의 달콤함',29900,'🥭',4.9,873,'["항공 직송","자연 후숙 특상","유통 마진 제로"]',true,4),
 (1,'mangosticky','망고 스티키라이스','방콕 야시장의 그 맛, 전자레인지 2분이면',12900,'active','망고·코코넛: 태국 / 찰밥: 국내','방콕 야시장의 그 맛, 전자레인지 2분이면',16000,'🍮',4.8,329,'["전자레인지 2분","1인분 개별 냉동","합리적 가격"]',false,5),
 (1,'watermelon','여름 이기는 꿀수박','비파괴 당도 선별로 실패 없는 한 통',19900,'active','국내산','비파괴 당도 선별로 실패 없는 한 통',25000,'🍉',4.8,506,'["비파괴 당도 선별","산지 직송","철통 에어박스 포장"]',true,6),
 (1,'grape','싱그러운 보라 포도','한 알 한 알 보랏빛 상큼함을 담은',13900,'active','국내산','한 알 한 알 보랏빛 상큼함을 담은',17000,'🍇',4.7,388,'["새벽 경매 직송","2차 정밀 선별","유통 마진 제로"]',false,7),
 (1,'chamoe','성주 기쁨 참외','아삭함에 한 번, 달콤함에 두 번',11900,'active','국내 · 성주','아삭함에 한 번, 달콤함에 두 번',14000,'🟡',4.8,467,'["성주 산지 직송","새벽 경매","2차 정밀 선별"]',false,8),
 (1,'avocado','프리미엄 아보카도','맛은 농장에서 시작되고 후숙에서 완성됩니다',12900,'active','미국/멕시코/칠레/페루','맛은 농장에서 시작되고 후숙에서 완성됩니다',15900,'🥑',4.6,271,'["산지 엄선 선별","후숙 관리","유통 단계 최소화"]',false,9),
 (1,'cherry','프리미엄 체리','햇살과 바람이 키운 붉은 보석',29900,'active','미국/페루','햇살과 바람이 키운 붉은 보석',39000,'🍒',4.9,712,'["산지 직수입","엄격 선별","유통 마진 절감"]',true,10),
 (1,'kiwi','뉴질랜드 골드키위','작은 골드빛, 큰 건강',15900,'active','뉴질랜드','작은 골드빛, 큰 건강',19000,'🥝',4.7,344,'["뉴질랜드 직수입","최적 후숙 관리","꼼꼼한 선별"]',false,11);

insert into public.product_option (product_pk, label, price, original_price, sort_order)
select p.pk, o.label, o.price, o.was, o.ord from public.product p
join (values
 ('gamgyul','실속 3kg · 소과',16900,21000,0),('gamgyul','가정용 5kg',25900,32000,1),('gamgyul','대용량 10kg',45900,58000,2),
 ('blueberry','100g × 5팩',18900,23000,0),('blueberry','박스 · 100g × 10팩',33900,42000,1),
 ('tomato','500g / 팩',9900,12900,0),('tomato','750g / 팩',13900,17000,1),
 ('mango','2kg',24900,29900,0),('mango','5kg',54900,69000,1),
 ('mangosticky','1인 홈카페 세트',12900,16000,0),('mangosticky','3회 가성비 세트',33900,42000,1),
 ('watermelon','6~7kg · 한 통',19900,25000,0),('watermelon','8kg 이상 · 한 통',24900,31000,1),
 ('grape','1송이 · 500~750g',13900,17000,0),('grape','박스 · 3~4송이',36900,46000,1),
 ('chamoe','3입 / 팩',11900,14000,0),('chamoe','5~7입 / 봉',17900,22000,1),
 ('avocado','5개입',12900,15900,0),('avocado','10개입',22900,28000,1),('avocado','박스 · 20~30개',39900,49000,2),
 ('cherry','1kg / 박스',29900,39000,0),('cherry','5kg / 박스',119000,155000,1),
 ('kiwi','1kg / 팩',15900,19000,0),('kiwi','2kg / 팩',27900,34000,1),('kiwi','3kg / 박스',38900,47000,2)
) as o(sku,label,price,was,ord) on o.sku = p.sku;

insert into public.product_image (product_pk, storage_key, alt_text, sort_order, purpose)
select p.pk, '/assets/crop/'||p.sku||'.png', p.name, 0, 'thumbnail' from public.product p;

insert into public.product_image (product_pk, storage_key, alt_text, sort_order, purpose)
select p.pk, '/assets/detail/'||p.sku||'.jpg', p.name||' 상세', 0, 'detail'
from public.product p where p.sku <> 'tomato';

-- ===== 사이트 설정 (기존 site_config 패턴: main_slide/<id>, home_banner) =====
insert into public.site_config (config_key, config_value) values
 ('site_title','Olive Open'),
 ('main_slide/s1','{"id":"s1","theme":"green","eyebrow":"DAWN AUCTION","title":"새벽 경매 직송,\n오늘 가장 신선한 과일","desc":"가락시장 새벽 경매 낙찰 과일을 당일 그대로 보내드려요","cta":"오늘의 특가 보기","link":"/category","image":"/assets/brand/auction.jpg","sort_order":0,"active":true}'),
 ('main_slide/s2','{"id":"s2","theme":"cream","eyebrow":"SEASONAL","title":"지금이 제철,\n7월의 과일 캘린더","desc":"이번 달 가장 맛있는 과일만 골라 담았어요","cta":"캘린더 보기","link":"/season","image":"/assets/brand/season.jpg","sort_order":1,"active":true}'),
 ('main_slide/s3','{"id":"s3","theme":"berry","eyebrow":"MD''S PICK","title":"프리미엄 체리,\n붉은 보석의 계절","desc":"산지 직수입 · 엄격 선별로 더 달콤하게","cta":"체리 보러가기","link":"/product/cherry","image":"/assets/detail/cherry.jpg","sort_order":2,"active":true}'),
 ('home_banner','{"title":"신선보장 프로그램","desc":"맛없으면 사진 한 장으로 100% 보상해 드려요","cta":"GO","link":"/brand"}'),
 ('home_text','{"searchPlaceholder":"오늘 먹고 싶은 과일을 검색해 보세요","pickLabel":"MD''S PICK","pickTitle":"오늘 새벽 경매 특가","catTitle":"카테고리"}');

-- ===== 제철 캘린더 =====
insert into public.seasonal_item (name, emoji, color, origin, months, product_pk, sort_order)
select s.name, s.emoji, s.color, s.origin, s.months::jsonb, p.pk, s.ord
from (values
 ('딸기','🍓','#E84B5A','경남 산청','[11,12,1,2,3]',null,0),
 ('한라봉','🍊','#F08A1D','제주 효돈','[12,1,2,3]',null,1),
 ('천혜향','🍊','#F2972B','제주 효돈','[12,1,2,3]',null,2),
 ('귤','🍊','#FF9E2C','제주 효돈','[12,1,2]','gamgyul',3),
 ('오렌지','🍊','#FF8A21','미국·호주산','[3,4,5]',null,4),
 ('망고','🥭','#F4B61C','태국산','[2,3,4,5,6]','mango',5),
 ('참외','🟡','#F5C518','경북 성주','[3,4,5,6,7]','chamoe',6),
 ('블루베리','🫐','#5B6CC4','평택 작목반','[4,5,6,7]','blueberry',7),
 ('키위','🥝','#8FB72E','뉴질랜드','[4,5,6,7,8,9]','kiwi',8),
 ('애플망고','🥭','#F0A91E','제주·영암','[4,5,6,7,8]','mango',9),
 ('망고스틴','🟣','#7B3B5E','태국산','[4,5,6]',null,10),
 ('메론','🍈','#9CC56A','공주 농협','[5,6,7,8,9,10]',null,11),
 ('수박','🍉','#E5495B','음성·양구','[5,6,7,8]','watermelon',12),
 ('체리','🍒','#C8203C','미국·남미산','[5,6,7]','cherry',13),
 ('복숭아','🍑','#F6A6B2','충주 농협','[6,7,8]',null,14),
 ('자두','🟣','#9B2F4E','경북 의성','[6,7,8]',null,15),
 ('샤인머스캣','🍇','#A7C84A','상주 농협','[7,8,9,10,11,12,1,2]','grape',16),
 ('포도','🍇','#5B3B86','상주·영천','[8,9,10,11]','grape',17),
 ('사과','🍎','#D62F35','청송·충주','[9,10,11,12,1,2]',null,18),
 ('배','🟡','#D9B44A','천안 농협','[9,10,11,12,1,2]',null,19),
 ('석류','🔴','#C0392B','미국산','[10,11,12]',null,20),
 ('감','🟠','#E8731C','창녕·진양','[10,11,12,1,2,3]',null,21)
) as s(name,emoji,color,origin,months,sku,ord)
left join public.product p on p.sku = s.sku;

-- ===== 라운지 스토리 =====
insert into public.lounge_story (tag, eyebrow, title, description, image_url, link, is_published, sort_order) values
 ('브랜드','WHY OLIVE OPEN','왜 올리브 오픈인가요','산지 → 새벽 경매 → 우리집, 3단계 유통으로 더 신선하게','/assets/brand/direct.jpg','/brand',true,0),
 ('제철','SEASON CALENDAR','7월의 제철 과일','지금 가장 맛있는 과일을 캘린더에서 확인하세요','/assets/brand/season.jpg','/season',true,1),
 ('산지','FARM STORY','제주 감귤 농장 이야기','바닷바람이 키운 노지 감귤의 계절','/assets/farm-jeju.jpg','/product/gamgyul',true,2);

-- ===== 쿠폰 =====
insert into public.coupon (code, name, type, value, min_order, issue_limit, until, is_active) values
 ('WELCOME10','신규가입 10% 할인','percent',10,20000,100,'2026-12-31',true),
 ('SUMMER3000','여름맞이 3,000원 할인','amount',3000,30000,200,'2026-08-31',true);

-- ===== 샘플 리뷰 =====
insert into public.product_review (product_pk, member_pk, author, rating, body, status)
select p.pk, m.pk, '올리브', r.rating, r.body, r.status from public.product p
cross join (select pk from public.member where id='olive') m
join (values
 ('gamgyul',5,'귤이 정말 달아요. 상자 열자마자 향이 확!','approved'),
 ('mango',5,'후숙 딱 맞춰 와서 바로 먹었어요. 최고.','approved'),
 ('cherry',4,'알이 굵고 단단해요. 배송도 빨랐습니다.','pending')
) as r(sku,rating,body,status) on r.sku = p.sku;
