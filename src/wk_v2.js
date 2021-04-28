import { sleep, extendConsole, click_btn } from './utils'
import { initHook } from './hook'

import { submitDelay, pageNextDelay, allauto, user_config } from './config'
import * as DOM from './topic_dom'
import element_ui_css from './assets/element-ui.css.txt'
import yun_css from './assets/yun.css.txt'

async function doTopic() {
    let setTixing = async (t)=> {
        console.log('[+] 题型:', t);
        $('#yun_status').text('当前题型：'+t);
    }; 

    if($('.wy-course-bottom .wy-course-btn-right .wy-btn').text().indexOf('Submit')==-1 && $('#J_prismPlayer').length==0) {
        // $('.page-next')[1].click();
        // await sleep(pageNextDelay);
        $('#yun_status').text('当前题目已完成');
        return false;
    }

    if($('img[title="录音"]').length!=0 && user_config.autodo.includes('auto_luyin')) {
        await setTixing('录音');
        await DOM.doReadRepeat();
    } else if($('.lib-textarea-container, .img-blank-answer').length!=0 && user_config.autodo.includes('auto_lytk')) {
        await setTixing('听力/图片填空');
        await DOM.doListenImgAnswer();
    } else if($('.lib-fill-blank-do-input-left').length!=0 && user_config.autodo.includes('auto_tiankong')) {
        await setTixing('填空');
        await DOM.doTianKone();
    } else if($('.lib-single-item-img').length!=0 && user_config.autodo.includes('auto_danxuan')) {
        await setTixing('单选');
        await DOM.doSingleChoose();
    } else if($('.lib-role-select-item').length!=0 && user_config.autodo.includes('auto_roleplay')) {
        await setTixing('角色扮演');
        await DOM.doRolePlay();
    } else if($('.ant-select-dropdown-menu-item').length!=0 && user_config.autodo.includes('auto_dropchoose')) {
        await setTixing('下拉选择');
        await DOM.doDropChoose();
    } else if($('.lib-drag-box').length!=0 && user_config.autodo.includes('auto_drag')) {
        await setTixing('托块');
        await DOM.doDrag();
    } else if($('#J_prismPlayer').length!=0 && user_config.autodo.includes('auto_video')) {
        await setTixing('视频');
        await DOM.doVideo();
        await sleep(user_config.delay); // 挂机，增加时长
        return true;
    } else {
        await DOM.unSupposedOrSkip();
        return false;
    }

    await sleep(user_config.delay); // 挂机，增加时长
    click_btn(); // Submit
    return true;
}

// ===========================================

let running = false;

async function initConf() {
    user_config = await GM.getValue('config', user_config);

    $.each(user_config.autodo, (index, id)=>{
        $('#'+id).prop("checked",true);
    });
    $('#set_tryerr').prop("checked", user_config.autotryerr);
    $('#set_manu').prop("checked", user_config.autostop);
    $('#set_auto_record').prop("checked", user_config.autorecord);
    $('#set_delay').val(user_config.delay);
}

async function doLoop() {
    while (running) {
        let status = await doTopic();
        if(!status && user_config.autostop) {
            $('#yun_status').text('不支持当前体型, 已停止');
            break;
        }
        console.log('[*]', '已完成，切换下一题。。。');
        await sleep(submitDelay);
        $('.page-next')[1].click()
        await sleep(pageNextDelay); 
    }
    $('.yunPanel button').prop('disabled', false);
    $('.yunPanel button').removeClass('is-disabled');
    $('#yun_status').text('IDLE');
}

extendConsole(window.console, true);
console.capsule('视听说', 'v4+');

initHook();
window.addEventListener ("load", pageFullyLoaded);

function pageFullyLoaded () {
    console.capsule('Yun', '注入窗口');
    GM.addStyle(element_ui_css);
    GM.addStyle(yun_css);
    $(document.body).after(`
    <div class="yunPanel">
        <div class="close">x</div>
        <h1 style="text-align: center;font-size: medium;">视听说 - 自动答题</h1>
        <hr>
        <h2 style="font-size: small;">自动完成题型：</h2>
        <p>
            <input type="checkbox" id="auto_tiankong">
            <label for="auto_tiankong">填空</label>
            <input type="checkbox" id="auto_luyin">
            <label for="auto_luyin">录音</label>
            <input type="checkbox" id="auto_lytk">
            <label for="auto_lytk">录音填空</label>
            <input type="checkbox" id="auto_roleplay">
            <label for="auto_roleplay">角色扮演</label>
            <input type="checkbox" id="auto_danxuan">
            <label for="auto_danxuan">单项选择</label>
            <input type="checkbox" id="auto_dropchoose">
            <label for="auto_dropchoose">下拉选择</label>
            <input type="checkbox" id="auto_drag">
            <label for="auto_drag">托块</label>
            <input type="checkbox" id="auto_video">
            <label for="auto_video">视频</label>
        </p>
        <h2 style="font-size: small;">设置</h2>
        <p>
            <p>
                <input type="checkbox" id="set_tryerr">
                <label for="set_tryerr">自动试错</label>
                <input type="checkbox" id="set_auto_record">
                <label for="set_auto_record">自动回答语音</label>
                <input type="checkbox" id="set_manu">
                <label for="set_manu">不支持题型停止</label>
            </p>
            <label class="el-input el-input--mini">每题耗时(ms) <input class="el-input__inner" style="width: 50px;padding: 3px;" type="text" id="set_delay"></label>
            <button class="el-button el-button--default el-button--mini" id="yun_save" style="float: left;margin-top:5px;width: 48%;margin-left: 0;">保存</button>
            <button class="el-button el-button--default el-button--mini" id="yun_reset" style="float: right;margin-top:5px;width: 48%;margin-left: 0;">默认</button>
            <div style="clear: both;"></div>
        </p>
        <div class="el-divider el-divider--horizontal" style="margin: 10px 0;"></div>
        <h2 id="yun_status" style="font-size: small;text-align: center;margin-bottom:8px;">IDLE</h2>
        <button class="el-button el-button--default el-button--mini" id="yun_doone" style="width: 100%;margin-bottom: 3px;margin-left: 0;">做一题</button>
        <button class="el-button el-button--primary el-button--mini" id="yun_start" style="width: 100%;margin-left: 0;">开始</button>
    </div>
    `);

    $('#yun_start').click(()=>{
        if($('#yun_start').text()=='开始') {
            $('#yun_doone').prop('disabled', true);
            $('#yun_doone').addClass('is-disabled');
            running = true;
            doLoop();
            $('#yun_start').text('停止')
        } else {
            $('.yunPanel button').prop('disabled', true);
            $('.yunPanel button').addClass('is-disabled');
            running = false;
            $('#yun_start').text('开始')
        }
    });

    $('#yun_doone').click(()=>{
        $('#yun_start').text('开始');
        running = false;
        $('.yunPanel button').prop('disabled', true);
        $('.yunPanel button').addClass('is-disabled');
        doTopic().then((result)=>{
            $('.yunPanel button').prop('disabled', false);
            $('.yunPanel button').removeClass('is-disabled');
            if(result) {
                $('#yun_status').text('Done!');
            }
        });
        
    });
    $('.yunPanel .close').click(()=>{$('.yunPanel').hide()});
    $('#yun_reset').click(()=>{ GM.deleteValue('config'); window.location.reload(); });
    $('#yun_save').click(()=>{
        user_config.autodo = []
        $.each(allauto, (index, id)=>{
            if($('#'+id).prop("checked")) {
                user_config.autodo.push(id);
            }
        });
        user_config.autotryerr = $('#set_tryerr').prop("checked");
        user_config.autostop = $('#set_manu').prop("checked");
        user_config.autorecord = $('#set_auto_record').prop("checked");
        user_config.delay = $('#set_delay').val();

        GM.setValue('config', user_config).then(()=>{
            $('#yun_status').text('保存成功');
        });
    });
    

    initConf();
}