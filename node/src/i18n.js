import process from 'node:process';

export const SUPPORTED_LANGUAGES = ['en', 'ja', 'ko', 'hi'];

const COMMON = {
  en: {
    description: 'CLI client for the Salta7 Store API',
    usage: 'Usage', globalOptions: 'Global options', commands: 'Commands', error: 'Error', warning: 'Warning',
    'common.result': 'Result', 'common.yes': 'Yes', 'common.no': 'No', 'common.unknown': 'Unknown', 'common.item_count': '{count} item(s)',
    'common.redacted_items': '<{count} item(s) redacted>', 'common.terminal_required': 'The interactive menu requires a terminal (TTY).',
    'common.select_product': 'Select a product', 'common.select_task_product': 'Select a task product', 'common.no_products': 'No selectable products were returned by the API.',
    'common.amount': 'Amount', 'common.quantity': 'Quantity', 'common.tokens_file': 'Token file', 'common.discord_invite': 'Discord invite URL/code',
    'common.boosts': 'Boosts', 'common.boosts_needed': 'Boosts needed', 'common.include_humanize': 'Include Humanize?', 'common.job_id': 'Job ID',
    'logo.tagline': 'Fast access to Salta7 tools',
    'menu.title': 'What do you want to do?', 'menu.prompt': 'Choose a command', 'menu.prices': 'Prices', 'menu.stock': 'Check stock', 'menu.balance': 'Balance',
    'menu.buy': 'Buy product', 'menu.history': 'Purchase history', 'menu.active': 'Active task', 'menu.watch': 'Watch task', 'menu.byot_quote': 'BYOT quote',
    'menu.boost': 'Create Boost task', 'menu.join': 'Create Join task', 'menu.humanize': 'Create Humanize task', 'menu.doctor': 'Doctor', 'menu.exit': 'Exit',
    'title.doctor': 'Doctor', 'title.prices': 'Products & prices', 'title.stock': 'Stock', 'title.balance': 'Balance', 'title.purchase': 'Purchase',
    'title.purchase_history': 'Purchase history', 'title.delivered_items': 'Delivered items', 'title.task_quote': 'Task quote', 'title.task_products': 'Task products',
    'title.active_task': 'Active task', 'title.task_status': 'Task status', 'title.task_history': 'Task history', 'title.task_items': 'Task items',
    'title.byot_quote': 'BYOT quote', 'title.boost': 'Boost', 'title.join': 'Join', 'title.humanize': 'Humanize',
    'task.created': 'Task created', 'task.status': 'Task status', 'task.running': 'Running', 'task.completed': 'Completed', 'task.partial': 'Partial',
    'task.failed': 'Failed', 'task.cancelled': 'Cancelled', 'task.delivered': 'delivered', 'task.humanized': 'humanized',
    'field.title': 'Title', 'field.name': 'Name', 'field.product': 'Product', 'field.products': 'Products', 'field.items': 'Items', 'field.data': 'Data',
    'field.results': 'Results', 'field.account': 'Account', 'field.price': 'Price', 'field.amount': 'Amount', 'field.quantity': 'Quantity', 'field.status': 'Status',
    'field.id': 'ID', 'field.format': 'Format', 'field.stock': 'Stock', 'field.warranty': 'Warranty', 'field.description': 'Description', 'field.details': 'Details',
    'field.admin_only': 'Admin only', 'field.job_id': 'Job ID', 'field.tool': 'Tool', 'field.mode': 'Mode', 'field.requested': 'Requested', 'field.error': 'Error',
    'field.message': 'Message', 'field.reason': 'Reason', 'field.failed': 'Failed', 'field.check': 'Check', 'field.value': 'Value', 'field.ok': 'OK',
    timeoutPositive: 'timeout must be greater than 0.', retriesPositive: 'retries must be at least 1.', intervalPositive: 'interval must be greater than 0.',
    tokenRequired: 'This command requires an API token. Set SALTA7_TOKEN or pass --token.', tokensFileRequired: 'This command requires --tokens-file.',
    tokensEmpty: 'Tokens file is empty.', tokensMax: 'The API accepts at most 100 BYOT tokens per task.', readFile: 'Could not read file: {path}',
    unknownCommand: 'Unknown command: {command}', unknownTask: 'Unknown task command: {command}', unknownOption: 'Unknown option: {option}', unexpectedArg: 'Unexpected argument: {arg}',
    amountInvalid: 'buy requires a product and amount between 1 and 10000.', purchaseTty: 'buy requires --yes when stdin is not interactive.', purchaseConfirm: 'Buy {amount} × {product}?', cancelled: 'Cancelled.',
    jobIdRequired: 'A job_id is required.', noJobId: 'Task response did not include job_id.', boostsNegative: '--boosts-needed cannot be negative.', boostStock: 'stock boost requires --boosts between 1 and 40.',
    joinStock: 'stock join requires --product and --quantity between 1 and 100.', humanizeStock: 'stock humanize requires --product and --quantity between 1 and 100.',
    selectProduct: 'Select a product', selectTaskProduct: 'Select a task product', invalidChoice: 'Invalid selection.', menuTitle: 'What do you want to do?', menuPrompt: 'Choose a command',
    doctorNode: 'Node.js 22+', doctorUrl: 'API base URL', doctorFetch: 'fetch()', doctorToken: 'API token', doctorApi: 'API connectivity', configured: 'configured', missing: 'not configured', ok: 'OK', failed: 'failed',
    tokenPerm: 'Token file permissions are too broad ({mode}): {path}', updateNone: 'No public package found.', updateCurrent: 'Already up to date ({version}).', updateAvailable: 'Update available: {current} → {latest}',
    updateConfirm: 'Install {latest} globally with npm?', updateDone: 'Updated to {latest}.', updateTty: 'update requires --yes when stdin is not interactive.',
    noProducts: 'No products available.', range: '{label} must be between {min} and {max}.', interactiveRequired: 'Interactive menu requires a TTY and human-readable output.',
    stockProductRequired: 'stock requires a product.', historyItemsRequired: 'history-items requires tx_id.', jsonUpdateYes: 'JSON update requires --yes for installation or --check for check-only mode.',
    toolJoinHumanize: '--tool must be join or humanize.', toolTaskHistory: '--tool must be boost, join, or humanize.', limitRange: 'limit must be between 1 and 100.',
    boostModeInvite: 'boost requires --mode stock|byot and --invite.', joinModeInvite: 'join requires --mode stock|byot and --invite.', humanizeMode: 'humanize requires --mode stock|byot.',
    promptJobId: 'job_id', promptTokensFile: 'token file', promptBoostsNeeded: 'boosts needed [0]', promptMode: 'mode (stock/byot)', promptInvite: 'invite', promptHumanize: 'Humanize?',
  },
  ja: {
    description: 'Salta7 Store API 用CLIクライアント',
    usage: '使い方', globalOptions: 'グローバルオプション', commands: 'コマンド', error: 'エラー', warning: '警告',
    'common.result': '結果', 'common.yes': 'はい', 'common.no': 'いいえ', 'common.unknown': '不明', 'common.item_count': '{count}件',
    'common.redacted_items': '<{count}件を非表示>', 'common.terminal_required': '対話メニューにはターミナル（TTY）が必要です。',
    'common.select_product': '商品を選択', 'common.select_task_product': 'タスク商品を選択', 'common.no_products': 'APIから選択可能な商品が返されませんでした。',
    'common.amount': '数量', 'common.quantity': '数量', 'common.tokens_file': 'トークンファイル', 'common.discord_invite': 'Discord招待URL/コード',
    'common.boosts': 'Boost数', 'common.boosts_needed': '必要Boost数', 'common.include_humanize': 'Humanizeを含めますか？', 'common.job_id': 'ジョブID',
    'logo.tagline': 'Salta7ツールへ素早くアクセス',
    'menu.title': '何をしますか？', 'menu.prompt': 'コマンドを選択', 'menu.prices': '商品・価格一覧', 'menu.stock': '在庫を確認', 'menu.balance': '残高を確認',
    'menu.buy': '商品を購入', 'menu.history': '購入履歴', 'menu.active': '実行中タスク', 'menu.watch': 'タスクを監視', 'menu.byot_quote': 'BYOT見積もり',
    'menu.boost': 'Boostタスクを作成', 'menu.join': 'Joinタスクを作成', 'menu.humanize': 'Humanizeタスクを作成', 'menu.doctor': '接続診断', 'menu.exit': '終了',
    'title.doctor': '接続診断', 'title.prices': '商品・価格一覧', 'title.stock': '在庫', 'title.balance': '残高', 'title.purchase': '購入',
    'title.purchase_history': '購入履歴', 'title.delivered_items': '受け取り済みアイテム', 'title.task_quote': 'タスク見積もり', 'title.task_products': 'タスク商品一覧',
    'title.active_task': '実行中タスク', 'title.task_status': 'タスク状態', 'title.task_history': 'タスク履歴', 'title.task_items': 'タスクアイテム',
    'title.byot_quote': 'BYOT見積もり', 'title.boost': 'Boost', 'title.join': 'Join', 'title.humanize': 'Humanize',
    'task.created': 'タスクを作成しました', 'task.status': 'タスク状態', 'task.running': '実行中', 'task.completed': '完了', 'task.partial': '一部完了',
    'task.failed': '失敗', 'task.cancelled': 'キャンセル済み', 'task.delivered': '配信済み', 'task.humanized': 'Humanize済み',
    'field.title': 'タイトル', 'field.name': '名前', 'field.product': '商品', 'field.products': '商品', 'field.items': 'アイテム', 'field.data': 'データ',
    'field.results': '結果', 'field.account': 'アカウント', 'field.price': '価格', 'field.amount': '数量', 'field.quantity': '数量', 'field.status': '状態',
    'field.id': 'ID', 'field.format': '形式', 'field.stock': '在庫', 'field.warranty': '保証', 'field.description': '説明', 'field.details': '詳細',
    'field.admin_only': '管理者限定', 'field.job_id': 'ジョブID', 'field.tool': 'ツール', 'field.mode': 'モード', 'field.requested': '要求数', 'field.error': 'エラー',
    'field.message': 'メッセージ', 'field.reason': '理由', 'field.failed': '失敗', 'field.check': '確認項目', 'field.value': '値', 'field.ok': '正常',
    timeoutPositive: 'timeoutは0より大きい値にしてください。', retriesPositive: 'retriesは1以上にしてください。', intervalPositive: 'intervalは0より大きい値にしてください。',
    tokenRequired: 'このコマンドにはAPIトークンが必要です。SALTA7_TOKENまたは--tokenを指定してください。', tokensFileRequired: 'このコマンドには--tokens-fileが必要です。',
    tokensEmpty: 'トークンファイルが空です。', tokensMax: 'BYOTトークンは1タスク最大100件です。', readFile: 'ファイルを読み込めません: {path}',
    unknownCommand: '不明なコマンドです: {command}', unknownTask: '不明なtaskコマンドです: {command}', unknownOption: '不明なオプションです: {option}', unexpectedArg: '余分な引数です: {arg}',
    amountInvalid: 'buyには商品名と1〜10000の数量が必要です。', purchaseTty: '非対話実行のbuyでは--yesが必要です。', purchaseConfirm: '{product} を {amount}個購入しますか？', cancelled: 'キャンセルしました。',
    jobIdRequired: 'job_idが必要です。', noJobId: 'タスク応答にjob_idがありません。', boostsNegative: '--boosts-neededは0以上にしてください。', boostStock: 'stock boostでは--boostsを1〜40で指定してください。',
    joinStock: 'stock joinでは--productと--quantity（1〜100）が必要です。', humanizeStock: 'stock humanizeでは--productと--quantity（1〜100）が必要です。',
    selectProduct: '商品を選択', selectTaskProduct: 'タスク商品を選択', invalidChoice: '選択が不正です。', menuTitle: '何をしますか？', menuPrompt: 'コマンドを選択',
    doctorNode: 'Node.js 22+', doctorUrl: 'APIベースURL', doctorFetch: 'fetch()', doctorToken: 'APIトークン', doctorApi: 'API接続', configured: '設定済み', missing: '未設定', ok: 'OK', failed: '失敗',
    tokenPerm: 'トークンファイルの権限が広すぎます ({mode}): {path}', updateNone: '公開済みNodeパッケージはありません。', updateCurrent: '最新版です ({version})。', updateAvailable: 'アップデートがあります: {current} → {latest}',
    updateConfirm: 'npmで {latest} をグローバルインストールしますか？', updateDone: '{latest} に更新しました。', updateTty: '非対話実行のupdateでは--yesが必要です。',
    noProducts: '利用可能な商品がありません。', range: '{label} は {min}〜{max} の範囲で指定してください。', interactiveRequired: '対話メニューにはTTYと通常表示モードが必要です。',
    stockProductRequired: 'stockには商品指定が必要です。', historyItemsRequired: 'history-itemsにはtx_idが必要です。', jsonUpdateYes: 'JSONモードのupdateは、インストール時に--yes、確認のみなら--checkが必要です。',
    toolJoinHumanize: '--toolにはjoinまたはhumanizeを指定してください。', toolTaskHistory: '--toolにはboost、join、humanizeのいずれかを指定してください。', limitRange: 'limitは1〜100で指定してください。',
    boostModeInvite: 'boostには--mode stock|byotと--inviteが必要です。', joinModeInvite: 'joinには--mode stock|byotと--inviteが必要です。', humanizeMode: 'humanizeには--mode stock|byotが必要です。',
    promptJobId: 'ジョブID', promptTokensFile: 'トークンファイル', promptBoostsNeeded: '必要Boost数 [0]', promptMode: 'モード (stock/byot)', promptInvite: '招待URL/コード', promptHumanize: 'Humanizeを含めますか？',
  },
  ko: {
    description: 'Salta7 Store API용 CLI 클라이언트', usage: '사용법', globalOptions: '전역 옵션', commands: '명령어', error: '오류', warning: '경고',
    'common.result': '결과', 'common.yes': '예', 'common.no': '아니요', 'common.unknown': '알 수 없음', 'common.item_count': '{count}개', 'common.redacted_items': '<{count}개 숨김>',
    'common.terminal_required': '대화형 메뉴에는 터미널(TTY)이 필요합니다.', 'common.select_product': '상품 선택', 'common.select_task_product': '작업 상품 선택', 'common.no_products': 'API에서 선택 가능한 상품을 반환하지 않았습니다.',
    'common.amount': '수량', 'common.quantity': '수량', 'common.tokens_file': '토큰 파일', 'common.discord_invite': 'Discord 초대 URL/코드', 'common.boosts': 'Boost 수', 'common.boosts_needed': '필요 Boost 수', 'common.include_humanize': 'Humanize를 포함할까요?', 'common.job_id': '작업 ID',
    'logo.tagline': 'Salta7 도구에 빠르게 접근', 'menu.title': '무엇을 할까요?', 'menu.prompt': '명령 선택', 'menu.prices': '상품/가격 목록', 'menu.stock': '재고 확인', 'menu.balance': '잔액 확인', 'menu.buy': '상품 구매', 'menu.history': '구매 기록', 'menu.active': '실행 중 작업', 'menu.watch': '작업 감시', 'menu.byot_quote': 'BYOT 견적', 'menu.boost': 'Boost 작업 생성', 'menu.join': 'Join 작업 생성', 'menu.humanize': 'Humanize 작업 생성', 'menu.doctor': '연결 진단', 'menu.exit': '종료',
    'title.doctor': '연결 진단', 'title.prices': '상품/가격 목록', 'title.stock': '재고', 'title.balance': '잔액', 'title.purchase': '구매', 'title.purchase_history': '구매 기록', 'title.delivered_items': '전달된 항목', 'title.task_quote': '작업 견적', 'title.task_products': '작업 상품', 'title.active_task': '실행 중 작업', 'title.task_status': '작업 상태', 'title.task_history': '작업 기록', 'title.task_items': '작업 항목', 'title.byot_quote': 'BYOT 견적', 'title.boost': 'Boost', 'title.join': 'Join', 'title.humanize': 'Humanize',
    'task.created': '작업을 생성했습니다', 'task.status': '작업 상태', 'task.running': '실행 중', 'task.completed': '완료', 'task.partial': '일부 완료', 'task.failed': '실패', 'task.cancelled': '취소됨', 'task.delivered': '전달됨', 'task.humanized': 'Humanize됨',
    'field.title': '제목', 'field.name': '이름', 'field.product': '상품', 'field.products': '상품', 'field.items': '항목', 'field.data': '데이터', 'field.results': '결과', 'field.account': '계정', 'field.price': '가격', 'field.amount': '수량', 'field.quantity': '수량', 'field.status': '상태', 'field.id': 'ID', 'field.format': '형식', 'field.stock': '재고', 'field.warranty': '보증', 'field.description': '설명', 'field.details': '상세', 'field.admin_only': '관리자 전용', 'field.job_id': '작업 ID', 'field.tool': '도구', 'field.mode': '모드', 'field.requested': '요청 수', 'field.error': '오류', 'field.message': '메시지', 'field.reason': '이유', 'field.failed': '실패', 'field.check': '검사', 'field.value': '값', 'field.ok': '정상',
    timeoutPositive: 'timeout은 0보다 커야 합니다.', retriesPositive: 'retries는 1 이상이어야 합니다.', intervalPositive: 'interval은 0보다 커야 합니다.', tokenRequired: '이 명령에는 API 토큰이 필요합니다. SALTA7_TOKEN 또는 --token을 지정하세요.', tokensFileRequired: '이 명령에는 --tokens-file이 필요합니다.', tokensEmpty: '토큰 파일이 비어 있습니다.', tokensMax: 'BYOT 토큰은 작업당 최대 100개입니다.', readFile: '파일을 읽을 수 없습니다: {path}', unknownCommand: '알 수 없는 명령어: {command}', unknownTask: '알 수 없는 task 명령어: {command}', unknownOption: '알 수 없는 옵션: {option}', unexpectedArg: '예상하지 못한 인수: {arg}', amountInvalid: 'buy에는 상품과 1~10000의 수량이 필요합니다.', purchaseTty: '비대화형 buy에는 --yes가 필요합니다.', purchaseConfirm: '{product} {amount}개를 구매할까요?', cancelled: '취소했습니다.', jobIdRequired: 'job_id가 필요합니다.', noJobId: '작업 응답에 job_id가 없습니다.', boostsNegative: '--boosts-needed는 음수일 수 없습니다.', boostStock: 'stock boost에는 1~40의 --boosts가 필요합니다.', joinStock: 'stock join에는 --product와 1~100의 --quantity가 필요합니다.', humanizeStock: 'stock humanize에는 --product와 1~100의 --quantity가 필요합니다.', selectProduct: '상품 선택', selectTaskProduct: '작업 상품 선택', invalidChoice: '잘못된 선택입니다.', menuTitle: '무엇을 할까요?', menuPrompt: '명령 선택', doctorNode: 'Node.js 22+', doctorUrl: 'API base URL', doctorFetch: 'fetch()', doctorToken: 'API 토큰', doctorApi: 'API 연결', configured: '설정됨', missing: '설정 안 됨', ok: 'OK', failed: '실패', tokenPerm: '토큰 파일 권한이 너무 넓습니다 ({mode}): {path}', updateNone: '공개된 Node 패키지가 없습니다.', updateCurrent: '최신 버전입니다 ({version}).', updateAvailable: '업데이트 가능: {current} → {latest}', updateConfirm: 'npm으로 {latest}를 전역 설치할까요?', updateDone: '{latest}로 업데이트했습니다.', updateTty: '비대화형 update에는 --yes가 필요합니다.', noProducts: '사용 가능한 상품이 없습니다.', range: '{label}은(는) {min}~{max} 범위여야 합니다.', interactiveRequired: '대화형 메뉴에는 TTY와 일반 출력 모드가 필요합니다.', stockProductRequired: 'stock에는 상품이 필요합니다.', historyItemsRequired: 'history-items에는 tx_id가 필요합니다.', jsonUpdateYes: 'JSON update는 설치 시 --yes, 확인만 할 때는 --check가 필요합니다.', toolJoinHumanize: '--tool은 join 또는 humanize여야 합니다.', toolTaskHistory: '--tool은 boost, join 또는 humanize여야 합니다.', limitRange: 'limit은 1~100이어야 합니다.', boostModeInvite: 'boost에는 --mode stock|byot와 --invite가 필요합니다.', joinModeInvite: 'join에는 --mode stock|byot와 --invite가 필요합니다.', humanizeMode: 'humanize에는 --mode stock|byot가 필요합니다.', promptJobId: '작업 ID', promptTokensFile: '토큰 파일', promptBoostsNeeded: '필요 Boost 수 [0]', promptMode: '모드 (stock/byot)', promptInvite: '초대 URL/코드', promptHumanize: 'Humanize를 포함할까요?',
  },
  hi: {
    description: 'Salta7 Store API के लिए CLI क्लाइंट', usage: 'उपयोग', globalOptions: 'ग्लोबल विकल्प', commands: 'कमांड', error: 'त्रुटि', warning: 'चेतावनी',
    'common.result': 'परिणाम', 'common.yes': 'हाँ', 'common.no': 'नहीं', 'common.unknown': 'अज्ञात', 'common.item_count': '{count} आइटम', 'common.redacted_items': '<{count} आइटम छिपाए गए>', 'common.terminal_required': 'इंटरैक्टिव मेनू के लिए टर्मिनल (TTY) आवश्यक है।', 'common.select_product': 'उत्पाद चुनें', 'common.select_task_product': 'टास्क उत्पाद चुनें', 'common.no_products': 'API ने कोई चुनने योग्य उत्पाद नहीं लौटाया।', 'common.amount': 'मात्रा', 'common.quantity': 'मात्रा', 'common.tokens_file': 'टोकन फ़ाइल', 'common.discord_invite': 'Discord invite URL/code', 'common.boosts': 'Boost संख्या', 'common.boosts_needed': 'आवश्यक Boost', 'common.include_humanize': 'Humanize शामिल करें?', 'common.job_id': 'Job ID',
    'logo.tagline': 'Salta7 टूल्स तक तेज़ पहुँच', 'menu.title': 'आप क्या करना चाहते हैं?', 'menu.prompt': 'कमांड चुनें', 'menu.prices': 'उत्पाद और कीमतें', 'menu.stock': 'स्टॉक देखें', 'menu.balance': 'बैलेंस देखें', 'menu.buy': 'उत्पाद खरीदें', 'menu.history': 'खरीद इतिहास', 'menu.active': 'सक्रिय टास्क', 'menu.watch': 'टास्क मॉनिटर करें', 'menu.byot_quote': 'BYOT कोट', 'menu.boost': 'Boost टास्क बनाएँ', 'menu.join': 'Join टास्क बनाएँ', 'menu.humanize': 'Humanize टास्क बनाएँ', 'menu.doctor': 'कनेक्शन जाँच', 'menu.exit': 'बाहर निकलें',
    'title.doctor': 'कनेक्शन जाँच', 'title.prices': 'उत्पाद और कीमतें', 'title.stock': 'स्टॉक', 'title.balance': 'बैलेंस', 'title.purchase': 'खरीद', 'title.purchase_history': 'खरीद इतिहास', 'title.delivered_items': 'मिले हुए आइटम', 'title.task_quote': 'टास्क कोट', 'title.task_products': 'टास्क उत्पाद', 'title.active_task': 'सक्रिय टास्क', 'title.task_status': 'टास्क स्थिति', 'title.task_history': 'टास्क इतिहास', 'title.task_items': 'टास्क आइटम', 'title.byot_quote': 'BYOT कोट', 'title.boost': 'Boost', 'title.join': 'Join', 'title.humanize': 'Humanize',
    'task.created': 'टास्क बनाया गया', 'task.status': 'टास्क स्थिति', 'task.running': 'चल रहा है', 'task.completed': 'पूरा', 'task.partial': 'आंशिक', 'task.failed': 'विफल', 'task.cancelled': 'रद्द', 'task.delivered': 'डिलीवर', 'task.humanized': 'Humanize किया गया',
    'field.title': 'शीर्षक', 'field.name': 'नाम', 'field.product': 'उत्पाद', 'field.products': 'उत्पाद', 'field.items': 'आइटम', 'field.data': 'डेटा', 'field.results': 'परिणाम', 'field.account': 'अकाउंट', 'field.price': 'कीमत', 'field.amount': 'मात्रा', 'field.quantity': 'मात्रा', 'field.status': 'स्थिति', 'field.id': 'ID', 'field.format': 'फ़ॉर्मेट', 'field.stock': 'स्टॉक', 'field.warranty': 'वारंटी', 'field.description': 'विवरण', 'field.details': 'विवरण', 'field.admin_only': 'केवल एडमिन', 'field.job_id': 'Job ID', 'field.tool': 'टूल', 'field.mode': 'मोड', 'field.requested': 'अनुरोधित', 'field.error': 'त्रुटि', 'field.message': 'संदेश', 'field.reason': 'कारण', 'field.failed': 'विफल', 'field.check': 'जाँच', 'field.value': 'मान', 'field.ok': 'ठीक',
    timeoutPositive: 'timeout 0 से बड़ा होना चाहिए।', retriesPositive: 'retries कम से कम 1 होना चाहिए।', intervalPositive: 'interval 0 से बड़ा होना चाहिए।', tokenRequired: 'इस कमांड के लिए API टोकन आवश्यक है। SALTA7_TOKEN सेट करें या --token दें।', tokensFileRequired: 'इस कमांड के लिए --tokens-file आवश्यक है।', tokensEmpty: 'टोकन फ़ाइल खाली है।', tokensMax: 'एक BYOT task में अधिकतम 100 टोकन स्वीकार हैं।', readFile: 'फ़ाइल पढ़ी नहीं जा सकी: {path}', unknownCommand: 'अज्ञात कमांड: {command}', unknownTask: 'अज्ञात task कमांड: {command}', unknownOption: 'अज्ञात विकल्प: {option}', unexpectedArg: 'अतिरिक्त argument: {arg}', amountInvalid: 'buy में product और 1 से 10000 के बीच amount आवश्यक है।', purchaseTty: 'Non-interactive buy के लिए --yes आवश्यक है।', purchaseConfirm: '{product} के {amount} खरीदें?', cancelled: 'रद्द किया गया।', jobIdRequired: 'job_id आवश्यक है।', noJobId: 'Task response में job_id नहीं है।', boostsNegative: '--boosts-needed ऋणात्मक नहीं हो सकता।', boostStock: 'stock boost में --boosts 1 से 40 के बीच होना चाहिए।', joinStock: 'stock join में --product और --quantity 1 से 100 के बीच आवश्यक हैं।', humanizeStock: 'stock humanize में --product और --quantity 1 से 100 के बीच आवश्यक हैं।', selectProduct: 'उत्पाद चुनें', selectTaskProduct: 'टास्क उत्पाद चुनें', invalidChoice: 'अमान्य चयन।', menuTitle: 'आप क्या करना चाहते हैं?', menuPrompt: 'कमांड चुनें', doctorNode: 'Node.js 22+', doctorUrl: 'API base URL', doctorFetch: 'fetch()', doctorToken: 'API token', doctorApi: 'API connectivity', configured: 'configured', missing: 'not configured', ok: 'OK', failed: 'failed', tokenPerm: 'Token file permissions बहुत broad हैं ({mode}): {path}', updateNone: 'कोई प्रकाशित Node पैकेज नहीं मिला।', updateCurrent: 'पहले से नवीनतम है ({version}).', updateAvailable: 'Update उपलब्ध: {current} → {latest}', updateConfirm: 'npm से {latest} globally install करें?', updateDone: '{latest} पर update हुआ।', updateTty: 'Non-interactive update के लिए --yes आवश्यक है।', noProducts: 'कोई उपलब्ध उत्पाद नहीं है।', range: '{label} {min} से {max} के बीच होना चाहिए।', interactiveRequired: 'इंटरैक्टिव मेनू के लिए TTY और human-readable आउटपुट आवश्यक है।', stockProductRequired: 'stock के लिए product आवश्यक है।', historyItemsRequired: 'history-items के लिए tx_id आवश्यक है।', jsonUpdateYes: 'JSON update में install के लिए --yes या केवल जाँच के लिए --check चाहिए।', toolJoinHumanize: '--tool join या humanize होना चाहिए।', toolTaskHistory: '--tool boost, join या humanize होना चाहिए।', limitRange: 'limit 1 से 100 होना चाहिए।', boostModeInvite: 'boost के लिए --mode stock|byot और --invite आवश्यक हैं।', joinModeInvite: 'join के लिए --mode stock|byot और --invite आवश्यक हैं।', humanizeMode: 'humanize के लिए --mode stock|byot आवश्यक है।', promptJobId: 'Job ID', promptTokensFile: 'टोकन फ़ाइल', promptBoostsNeeded: 'आवश्यक Boost [0]', promptMode: 'मोड (stock/byot)', promptInvite: 'invite URL/code', promptHumanize: 'Humanize शामिल करें?',
  },
};

let language = 'en';
export function detectLanguage(value = 'auto') {
  if (SUPPORTED_LANGUAGES.includes(value)) return value;
  const raw = (process.env.SALTA7_LANG || process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '').toLowerCase();
  const p = raw.split(/[_.-]/)[0];
  return SUPPORTED_LANGUAGES.includes(p) ? p : 'en';
}
export function setLanguage(value = 'auto') { language = detectLanguage(value); return language; }
export function getLanguage() { return language; }
export function t(key, values = {}) {
  let text = COMMON[language]?.[key] ?? COMMON.en[key] ?? key;
  for (const [k, v] of Object.entries(values)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}
