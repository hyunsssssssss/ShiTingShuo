// 下方时间你可以根据你的网络情况酌情调整
const submitDelay = 3000;       // Submit 之后的等待时间
const pageNextDelay = 5000;     // 换页 之后的等待时间
const inputDelay = 500;         // 输入 之后的等待时间

const allauto = ['auto_tiankong', 'auto_luyin', 'auto_lytk', 'auto_roleplay', 'auto_danxuan', 'auto_dropchoose', 'auto_drag', 'auto_video'];
let user_config = {
    'autodo': allauto,
    'autotryerr': true,
    'autostop': false,
    'autorecord': true,
    'delay': 10000
};

export {submitDelay, pageNextDelay, inputDelay, allauto, user_config}