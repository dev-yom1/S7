import process from 'node:process';

export const SUPPORTED_LANGUAGES = ['en', 'ja', 'ko', 'hi'];
const M = {
  en: {
    description:'CLI client for the Salta7 Store API',
    humanizeRequired:'Humanize requires at least one profile option.', humanizeUnknown:'Unknown Humanize field(s): {fields}', humanizeSpec:'Humanize field {field} must be an object.', humanizeSource:'Humanize field {field} source must be random or custom.', bannerCustom:'banner supports custom source only.', customValue:'Humanize custom field {field} requires value.', nameLength:'name must be at most 32 characters.', bioLength:'bio must be at most 190 characters.', pronounsLength:'pronouns must be at most 40 characters.', hypesquadInvalid:'hypesquad must be 1/2/3 or bravery/brilliance/balance.', imageNotFound:'Image file was not found: {path}', imageType:'Unsupported image type: {path}', avatarInvalid:'--avatar-url must use http://, https://, or data:image/.', bannerInvalid:'--banner-data must be a data:image/ URL.', jsonInvalid:'Invalid Humanize JSON: {error}',
    usage:'Usage', globalOptions:'Global options', commands:'Commands', error:'Error', warning:'Warning',
    tokenRequired:'This command requires an API token. Set SALTA7_TOKEN or pass --token.', timeoutPositive:'timeout must be greater than 0.', retriesPositive:'retries must be at least 1.',
    intervalPositive:'interval must be greater than 0.', tokensFileRequired:'This command requires --tokens-file.', tokensEmpty:'Tokens file is empty.', tokensMax:'The API accepts at most 100 BYOT tokens per task.',
    readFile:'Could not read file: {path}', unknownCommand:'Unknown command: {command}', unknownTask:'Unknown task command: {command}', unknownOption:'Unknown option: {option}', unexpectedArg:'Unexpected argument: {arg}',
    amountInvalid:'buy requires a product and amount between 1 and 10000.', purchaseTty:'buy requires --yes when stdin is not interactive.', purchaseConfirm:'Buy {amount} × {product}?', cancelled:'Cancelled.',
    jobIdRequired:'A job_id is required.', noJobId:'Task response did not include job_id.', boostsNegative:'--boosts-needed cannot be negative.', boostStock:'stock boost requires --boosts between 1 and 40.',
    joinStock:'stock join requires --product and --quantity between 1 and 100.', humanizeStock:'stock humanize requires --product and --quantity between 1 and 100.',
    selectProduct:'Select a product', selectTaskProduct:'Select a task product', invalidChoice:'Invalid selection.', menuTitle:'Salta7 Node menu', menuPrompt:'Choose a command',
    doctorNode:'Node.js 22+', doctorUrl:'API base URL', doctorFetch:'fetch()', doctorToken:'API token', doctorApi:'API connectivity', configured:'configured', missing:'not configured', ok:'OK', failed:'failed',
    tokenPerm:'Token file permissions are too broad ({mode}): {path}', updateNone:'No public release found.', updateCurrent:'Already up to date ({version}).', updateAvailable:'Update available: {current} → {latest}',
    updateConfirm:'Install {latest} globally with npm?', updateDone:'Updated to {latest}.', updateTty:'update requires --yes when stdin is not interactive.',
  },
  ja: {
    description:'Salta7 Store API用CLIクライアント',
    humanizeRequired:'Humanizeにはプロフィール設定を1つ以上指定してください。', humanizeUnknown:'不明なHumanizeフィールドです: {fields}', humanizeSpec:'Humanizeの{field}はオブジェクトで指定してください。', humanizeSource:'Humanizeの{field}.sourceはrandomまたはcustomにしてください。', bannerCustom:'bannerはcustomのみ対応です。', customValue:'Humanizeのcustomフィールド{field}にはvalueが必要です。', nameLength:'nameは32文字以内です。', bioLength:'bioは190文字以内です。', pronounsLength:'pronounsは40文字以内です。', hypesquadInvalid:'hypesquadは1/2/3またはbravery/brilliance/balanceを指定してください。', imageNotFound:'画像ファイルが見つかりません: {path}', imageType:'未対応の画像形式です: {path}', avatarInvalid:'--avatar-urlはhttp://、https://、data:image/のいずれかにしてください。', bannerInvalid:'--banner-dataはdata:image/ URLにしてください。', jsonInvalid:'Humanize JSONが不正です: {error}',
    usage:'使い方', globalOptions:'グローバルオプション', commands:'コマンド', error:'エラー', warning:'警告',
    tokenRequired:'このコマンドにはAPIトークンが必要です。SALTA7_TOKENまたは--tokenを指定してください。', timeoutPositive:'timeoutは0より大きい値にしてください。', retriesPositive:'retriesは1以上にしてください。',
    intervalPositive:'intervalは0より大きい値にしてください。', tokensFileRequired:'このコマンドには--tokens-fileが必要です。', tokensEmpty:'トークンファイルが空です。', tokensMax:'BYOTトークンは1タスク最大100件です。',
    readFile:'ファイルを読み込めません: {path}', unknownCommand:'不明なコマンドです: {command}', unknownTask:'不明なtaskコマンドです: {command}', unknownOption:'不明なオプションです: {option}', unexpectedArg:'余分な引数です: {arg}',
    amountInvalid:'buyには商品名と1〜10000のamountが必要です。', purchaseTty:'非対話実行のbuyでは--yesが必要です。', purchaseConfirm:'{product} を {amount} 個購入しますか？', cancelled:'キャンセルしました。',
    jobIdRequired:'job_idが必要です。', noJobId:'タスク応答にjob_idがありません。', boostsNegative:'--boosts-neededは0以上にしてください。', boostStock:'stock boostでは--boostsを1〜40で指定してください。',
    joinStock:'stock joinでは--productと--quantity（1〜100）が必要です。', humanizeStock:'stock humanizeでは--productと--quantity（1〜100）が必要です。',
    selectProduct:'商品を選択', selectTaskProduct:'タスク商品を選択', invalidChoice:'選択が不正です。', menuTitle:'Salta7 Node メニュー', menuPrompt:'コマンドを選択',
    doctorNode:'Node.js 22+', doctorUrl:'APIベースURL', doctorFetch:'fetch()', doctorToken:'APIトークン', doctorApi:'API接続', configured:'設定済み', missing:'未設定', ok:'OK', failed:'失敗',
    tokenPerm:'トークンファイルの権限が広すぎます ({mode}): {path}', updateNone:'公開リリースはありません。', updateCurrent:'最新版です ({version})。', updateAvailable:'アップデートがあります: {current} → {latest}',
    updateConfirm:'npmで {latest} をグローバルインストールしますか？', updateDone:'{latest} に更新しました。', updateTty:'非対話実行のupdateでは--yesが必要です。',
  },
  ko: {
    description:'Salta7 Store API용 CLI 클라이언트',
    humanizeRequired:'Humanize에는 하나 이상의 프로필 옵션이 필요합니다.', humanizeUnknown:'알 수 없는 Humanize 필드: {fields}', humanizeSpec:'Humanize 필드 {field}는 객체여야 합니다.', humanizeSource:'Humanize 필드 {field} source는 random 또는 custom이어야 합니다.', bannerCustom:'banner는 custom source만 지원합니다.', customValue:'Humanize custom 필드 {field}에는 value가 필요합니다.', nameLength:'name은 최대 32자입니다.', bioLength:'bio는 최대 190자입니다.', pronounsLength:'pronouns는 최대 40자입니다.', hypesquadInvalid:'hypesquad는 1/2/3 또는 bravery/brilliance/balance여야 합니다.', imageNotFound:'이미지 파일을 찾을 수 없습니다: {path}', imageType:'지원하지 않는 이미지 형식입니다: {path}', avatarInvalid:'--avatar-url은 http://, https:// 또는 data:image/를 사용해야 합니다.', bannerInvalid:'--banner-data는 data:image/ URL이어야 합니다.', jsonInvalid:'Humanize JSON이 올바르지 않습니다: {error}',
    usage:'사용법', globalOptions:'전역 옵션', commands:'명령어', error:'오류', warning:'경고',
    tokenRequired:'이 명령에는 API 토큰이 필요합니다. SALTA7_TOKEN 또는 --token을 지정하세요.', timeoutPositive:'timeout은 0보다 커야 합니다.', retriesPositive:'retries는 1 이상이어야 합니다.',
    intervalPositive:'interval은 0보다 커야 합니다.', tokensFileRequired:'이 명령에는 --tokens-file이 필요합니다.', tokensEmpty:'토큰 파일이 비어 있습니다.', tokensMax:'BYOT 토큰은 작업당 최대 100개입니다.',
    readFile:'파일을 읽을 수 없습니다: {path}', unknownCommand:'알 수 없는 명령어: {command}', unknownTask:'알 수 없는 task 명령어: {command}', unknownOption:'알 수 없는 옵션: {option}', unexpectedArg:'예상하지 못한 인수: {arg}',
    amountInvalid:'buy에는 상품과 1~10000의 amount가 필요합니다.', purchaseTty:'비대화형 buy에는 --yes가 필요합니다.', purchaseConfirm:'{product} {amount}개를 구매할까요?', cancelled:'취소했습니다.',
    jobIdRequired:'job_id가 필요합니다.', noJobId:'작업 응답에 job_id가 없습니다.', boostsNegative:'--boosts-needed는 음수일 수 없습니다.', boostStock:'stock boost에는 1~40의 --boosts가 필요합니다.',
    joinStock:'stock join에는 --product와 1~100의 --quantity가 필요합니다.', humanizeStock:'stock humanize에는 --product와 1~100의 --quantity가 필요합니다.',
    selectProduct:'상품 선택', selectTaskProduct:'작업 상품 선택', invalidChoice:'잘못된 선택입니다.', menuTitle:'Salta7 Node 메뉴', menuPrompt:'명령 선택',
    doctorNode:'Node.js 22+', doctorUrl:'API base URL', doctorFetch:'fetch()', doctorToken:'API 토큰', doctorApi:'API 연결', configured:'설정됨', missing:'설정 안 됨', ok:'OK', failed:'실패',
    tokenPerm:'토큰 파일 권한이 너무 넓습니다 ({mode}): {path}', updateNone:'공개 릴리스가 없습니다.', updateCurrent:'최신 버전입니다 ({version}).', updateAvailable:'업데이트 가능: {current} → {latest}',
    updateConfirm:'npm으로 {latest}를 전역 설치할까요?', updateDone:'{latest}로 업데이트했습니다.', updateTty:'비대화형 update에는 --yes가 필요합니다.',
  },
  hi: {
    description:'Salta7 Store API के लिए CLI क्लाइंट',
    humanizeRequired:'Humanize के लिए कम से कम एक profile विकल्प चाहिए।', humanizeUnknown:'अज्ञात Humanize field(s): {fields}', humanizeSpec:'Humanize field {field} एक object होना चाहिए।', humanizeSource:'Humanize field {field} source random या custom होना चाहिए।', bannerCustom:'banner केवल custom source को support करता है।', customValue:'Humanize custom field {field} में value आवश्यक है।', nameLength:'name अधिकतम 32 characters हो सकता है।', bioLength:'bio अधिकतम 190 characters हो सकता है।', pronounsLength:'pronouns अधिकतम 40 characters हो सकता है।', hypesquadInvalid:'hypesquad 1/2/3 या bravery/brilliance/balance होना चाहिए।', imageNotFound:'Image file नहीं मिली: {path}', imageType:'Unsupported image type: {path}', avatarInvalid:'--avatar-url में http://, https://, या data:image/ होना चाहिए।', bannerInvalid:'--banner-data एक data:image/ URL होना चाहिए।', jsonInvalid:'Humanize JSON अमान्य है: {error}',
    usage:'उपयोग', globalOptions:'ग्लोबल विकल्प', commands:'कमांड', error:'त्रुटि', warning:'चेतावनी',
    tokenRequired:'इस कमांड के लिए API टोकन आवश्यक है। SALTA7_TOKEN सेट करें या --token दें।', timeoutPositive:'timeout 0 से बड़ा होना चाहिए।', retriesPositive:'retries कम से कम 1 होना चाहिए।',
    intervalPositive:'interval 0 से बड़ा होना चाहिए।', tokensFileRequired:'इस कमांड के लिए --tokens-file आवश्यक है।', tokensEmpty:'टोकन फ़ाइल खाली है।', tokensMax:'एक BYOT task में अधिकतम 100 टोकन स्वीकार हैं।',
    readFile:'फ़ाइल पढ़ी नहीं जा सकी: {path}', unknownCommand:'अज्ञात कमांड: {command}', unknownTask:'अज्ञात task कमांड: {command}', unknownOption:'अज्ञात विकल्प: {option}', unexpectedArg:'अतिरिक्त argument: {arg}',
    amountInvalid:'buy में product और 1 से 10000 के बीच amount आवश्यक है।', purchaseTty:'Non-interactive buy के लिए --yes आवश्यक है।', purchaseConfirm:'{product} के {amount} खरीदें?', cancelled:'रद्द किया गया।',
    jobIdRequired:'job_id आवश्यक है।', noJobId:'Task response में job_id नहीं है।', boostsNegative:'--boosts-needed ऋणात्मक नहीं हो सकता।', boostStock:'stock boost में --boosts 1 से 40 के बीच होना चाहिए।',
    joinStock:'stock join में --product और --quantity 1 से 100 के बीच आवश्यक हैं।', humanizeStock:'stock humanize में --product और --quantity 1 से 100 के बीच आवश्यक हैं।',
    selectProduct:'Product चुनें', selectTaskProduct:'Task product चुनें', invalidChoice:'अमान्य चयन।', menuTitle:'Salta7 Node menu', menuPrompt:'कमांड चुनें',
    doctorNode:'Node.js 22+', doctorUrl:'API base URL', doctorFetch:'fetch()', doctorToken:'API token', doctorApi:'API connectivity', configured:'configured', missing:'not configured', ok:'OK', failed:'failed',
    tokenPerm:'Token file permissions बहुत broad हैं ({mode}): {path}', updateNone:'कोई public release नहीं मिली।', updateCurrent:'पहले से नवीनतम है ({version}).', updateAvailable:'Update उपलब्ध: {current} → {latest}',
    updateConfirm:'npm से {latest} globally install करें?', updateDone:'{latest} पर update हुआ।', updateTty:'Non-interactive update के लिए --yes आवश्यक है।',
  }
};
let language = 'en';
export function detectLanguage(value='auto') { if (SUPPORTED_LANGUAGES.includes(value)) return value; const raw=(process.env.LC_ALL||process.env.LC_MESSAGES||process.env.LANG||'').toLowerCase(); const p=raw.split(/[_.-]/)[0]; return SUPPORTED_LANGUAGES.includes(p)?p:'en'; }
export function setLanguage(value='auto') { language=detectLanguage(value); return language; }
export function getLanguage(){ return language; }
export function t(key, values={}) { let text=M[language]?.[key]??M.en[key]??key; for(const [k,v] of Object.entries(values)) text=text.replaceAll(`{${k}}`,String(v)); return text; }
