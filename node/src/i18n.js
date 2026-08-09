import process from 'node:process';

export const SUPPORTED_LANGUAGES = ['en', 'ja', 'ko', 'hi'];

const MESSAGES = {
  en: {
    description: 'CLI client for the Salta7 Store API',
    usage: 'Usage', globalOptions: 'Global options', commands: 'Commands', error: 'Error',
    tokenRequired: 'This command requires an API token. Set SALTA7_TOKEN or pass --token.',
    timeoutPositive: 'timeout must be greater than 0.', retriesPositive: 'retries must be at least 1.',
    intervalPositive: 'interval must be greater than 0.', tokensFileRequired: 'This command requires --tokens-file.',
    tokensEmpty: 'Tokens file is empty.', tokensMax: 'The API accepts at most 100 BYOT tokens per task.',
    readFile: 'Could not read file: {path}', jsonInvalid: 'Invalid Humanize JSON: {error}', humanizeRequired: 'Humanize requires at least one profile option.',
    unknownCommand: 'Unknown command: {command}', unknownTask: 'Unknown task command: {command}',
    boostStock: 'stock boost requires --boosts between 1 and 40.', joinStock: 'stock join requires --product and --quantity between 1 and 100.',
    humanizeStock: 'stock humanize requires --product and --quantity between 1 and 100.', byotTokens: 'BYOT mode requires --tokens-file.',
    boostsNegative: '--boosts-needed cannot be negative.', jobIdRequired: 'A job_id is required.',
    noJobId: 'Task response did not include job_id.', imageNotFound: 'Image file was not found: {path}', imageType: 'Unsupported image type: {path}',
    avatarInvalid: '--avatar-url must use http://, https://, or data:image/.', bannerInvalid: '--banner-data must be a data:image/ URL.',
    hypesquadInvalid: 'hypesquad must be 1/2/3 or bravery/brilliance/balance.', humanizeUnknown: 'Unknown Humanize field(s): {fields}',
    humanizeSpec: 'Humanize field {field} must be an object.', humanizeSource: 'Humanize field {field} source must be random or custom.',
    bannerCustom: 'banner supports custom source only.', customValue: 'Humanize custom field {field} requires value.',
    nameLength: 'name must be at most 32 characters.', bioLength: 'bio must be at most 190 characters.', pronounsLength: 'pronouns must be at most 40 characters.',
    purchaseYes: 'Node CLI requires --yes for non-interactive buy.', amountInvalid: 'buy requires a product and amount between 1 and 10000.',
  },
  ja: {
    description: 'Salta7 Store API用CLIクライアント', usage: '使い方', globalOptions: 'グローバルオプション', commands: 'コマンド', error: 'エラー',
    tokenRequired: 'このコマンドにはAPIトークンが必要です。SALTA7_TOKENまたは--tokenを指定してください。', timeoutPositive: 'timeoutは0より大きい値にしてください。',
    retriesPositive: 'retriesは1以上にしてください。', intervalPositive: 'intervalは0より大きい値にしてください。', tokensFileRequired: 'このコマンドには--tokens-fileが必要です。',
    tokensEmpty: 'トークンファイルが空です。', tokensMax: 'BYOTトークンは1タスク最大100件です。', readFile: 'ファイルを読み込めません: {path}',
    jsonInvalid: 'Humanize JSONが不正です: {error}', humanizeRequired: 'Humanizeにはプロフィール設定を1つ以上指定してください。',
    unknownCommand: '不明なコマンドです: {command}', unknownTask: '不明なtaskコマンドです: {command}', boostStock: 'stock boostでは--boostsを1〜40で指定してください。',
    joinStock: 'stock joinでは--productと--quantity（1〜100）が必要です。', humanizeStock: 'stock humanizeでは--productと--quantity（1〜100）が必要です。',
    byotTokens: 'BYOTモードでは--tokens-fileが必要です。', boostsNegative: '--boosts-neededは0以上にしてください。', jobIdRequired: 'job_idが必要です。', noJobId: 'タスク応答にjob_idがありません。',
    imageNotFound: '画像ファイルが見つかりません: {path}', imageType: '未対応の画像形式です: {path}', avatarInvalid: '--avatar-urlはhttp://、https://、data:image/のいずれかにしてください。',
    bannerInvalid: '--banner-dataはdata:image/ URLにしてください。', hypesquadInvalid: 'hypesquadは1/2/3またはbravery/brilliance/balanceを指定してください。',
    humanizeUnknown: '不明なHumanizeフィールドです: {fields}', humanizeSpec: 'Humanizeの{field}はオブジェクトで指定してください。', humanizeSource: 'Humanizeの{field}.sourceはrandomまたはcustomにしてください。',
    bannerCustom: 'bannerはcustomのみ対応です。', customValue: 'Humanizeのcustomフィールド{field}にはvalueが必要です。', nameLength: 'nameは32文字以内です。', bioLength: 'bioは190文字以内です。',
    pronounsLength: 'pronounsは40文字以内です。', purchaseYes: '非対話実行のbuyでは--yesが必要です。', amountInvalid: 'buyには商品名と1〜10000のamountが必要です。',
  },
  ko: {
    description: 'Salta7 Store API용 CLI 클라이언트', usage: '사용법', globalOptions: '전역 옵션', commands: '명령어', error: '오류',
    tokenRequired: '이 명령에는 API 토큰이 필요합니다. SALTA7_TOKEN 또는 --token을 지정하세요.', timeoutPositive: 'timeout은 0보다 커야 합니다.', retriesPositive: 'retries는 1 이상이어야 합니다.',
    intervalPositive: 'interval은 0보다 커야 합니다.', tokensFileRequired: '이 명령에는 --tokens-file이 필요합니다.', tokensEmpty: '토큰 파일이 비어 있습니다.', tokensMax: 'BYOT 토큰은 작업당 최대 100개입니다.',
    readFile: '파일을 읽을 수 없습니다: {path}', jsonInvalid: 'Humanize JSON이 올바르지 않습니다: {error}', humanizeRequired: 'Humanize에는 하나 이상의 프로필 옵션이 필요합니다.', unknownCommand: '알 수 없는 명령어: {command}', unknownTask: '알 수 없는 task 명령어: {command}',
    boostStock: 'stock boost에는 1~40의 --boosts가 필요합니다.', joinStock: 'stock join에는 --product와 1~100의 --quantity가 필요합니다.', humanizeStock: 'stock humanize에는 --product와 1~100의 --quantity가 필요합니다.',
    byotTokens: 'BYOT 모드에는 --tokens-file이 필요합니다.', boostsNegative: '--boosts-needed는 음수일 수 없습니다.', jobIdRequired: 'job_id가 필요합니다.', noJobId: '작업 응답에 job_id가 없습니다.',
    imageNotFound: '이미지 파일을 찾을 수 없습니다: {path}', imageType: '지원하지 않는 이미지 형식입니다: {path}', avatarInvalid: '--avatar-url은 http://, https:// 또는 data:image/를 사용해야 합니다.', bannerInvalid: '--banner-data는 data:image/ URL이어야 합니다.',
    hypesquadInvalid: 'hypesquad는 1/2/3 또는 bravery/brilliance/balance여야 합니다.', humanizeUnknown: '알 수 없는 Humanize 필드: {fields}', humanizeSpec: 'Humanize 필드 {field}는 객체여야 합니다.', humanizeSource: 'Humanize 필드 {field} source는 random 또는 custom이어야 합니다.',
    bannerCustom: 'banner는 custom source만 지원합니다.', customValue: 'Humanize custom 필드 {field}에는 value가 필요합니다.', nameLength: 'name은 최대 32자입니다.', bioLength: 'bio는 최대 190자입니다.', pronounsLength: 'pronouns는 최대 40자입니다.',
    purchaseYes: '비대화형 buy에는 --yes가 필요합니다.', amountInvalid: 'buy에는 상품과 1~10000의 amount가 필요합니다.',
  },
  hi: {
    description: 'Salta7 Store API के लिए CLI क्लाइंट', usage: 'उपयोग', globalOptions: 'ग्लोबल विकल्प', commands: 'कमांड', error: 'त्रुटि',
    tokenRequired: 'इस कमांड के लिए API टोकन आवश्यक है। SALTA7_TOKEN सेट करें या --token दें।', timeoutPositive: 'timeout 0 से बड़ा होना चाहिए।', retriesPositive: 'retries कम से कम 1 होना चाहिए।',
    intervalPositive: 'interval 0 से बड़ा होना चाहिए।', tokensFileRequired: 'इस कमांड के लिए --tokens-file आवश्यक है।', tokensEmpty: 'टोकन फ़ाइल खाली है।', tokensMax: 'एक BYOT task में अधिकतम 100 टोकन स्वीकार हैं।',
    readFile: 'फ़ाइल पढ़ी नहीं जा सकी: {path}', jsonInvalid: 'Humanize JSON अमान्य है: {error}', humanizeRequired: 'Humanize के लिए कम से कम एक profile विकल्प चाहिए।', unknownCommand: 'अज्ञात कमांड: {command}', unknownTask: 'अज्ञात task कमांड: {command}',
    boostStock: 'stock boost में --boosts 1 से 40 के बीच होना चाहिए।', joinStock: 'stock join में --product और --quantity 1 से 100 के बीच आवश्यक हैं।', humanizeStock: 'stock humanize में --product और --quantity 1 से 100 के बीच आवश्यक हैं।',
    byotTokens: 'BYOT mode में --tokens-file आवश्यक है।', boostsNegative: '--boosts-needed ऋणात्मक नहीं हो सकता।', jobIdRequired: 'job_id आवश्यक है।', noJobId: 'Task response में job_id नहीं है।',
    imageNotFound: 'Image file नहीं मिली: {path}', imageType: 'Unsupported image type: {path}', avatarInvalid: '--avatar-url में http://, https://, या data:image/ होना चाहिए।', bannerInvalid: '--banner-data एक data:image/ URL होना चाहिए।',
    hypesquadInvalid: 'hypesquad 1/2/3 या bravery/brilliance/balance होना चाहिए।', humanizeUnknown: 'अज्ञात Humanize field(s): {fields}', humanizeSpec: 'Humanize field {field} एक object होना चाहिए।', humanizeSource: 'Humanize field {field} source random या custom होना चाहिए।',
    bannerCustom: 'banner केवल custom source को support करता है।', customValue: 'Humanize custom field {field} में value आवश्यक है।', nameLength: 'name अधिकतम 32 characters हो सकता है।', bioLength: 'bio अधिकतम 190 characters हो सकता है।', pronounsLength: 'pronouns अधिकतम 40 characters हो सकता है।',
    purchaseYes: 'Non-interactive buy के लिए --yes आवश्यक है।', amountInvalid: 'buy में product और 1 से 10000 के बीच amount आवश्यक है।',
  },
};

let language = 'en';

export function detectLanguage(value = 'auto') {
  if (SUPPORTED_LANGUAGES.includes(value)) return value;
  const raw = (process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '').toLowerCase();
  const prefix = raw.split(/[_.-]/)[0];
  return SUPPORTED_LANGUAGES.includes(prefix) ? prefix : 'en';
}

export function setLanguage(value = 'auto') { language = detectLanguage(value); return language; }
export function getLanguage() { return language; }
export function t(key, values = {}) {
  let text = MESSAGES[language]?.[key] ?? MESSAGES.en[key] ?? key;
  for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}
