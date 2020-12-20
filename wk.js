// ==UserScript==
// @name         清华社视听说 - 自动答题
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  解放你的双手
// @author       Hyun
// @include      *://www.tsinghuaelt.com/course-study-student/*
// @icon        https://www.tsinghuaelt.com/favicon.ico
// @require     https://cdn.staticfile.org/jquery/3.5.1/jquery.min.js
// @grant        GM_addStyle
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.deleteValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let vocabulary = ['fantastic', 'error', 'whatsoever', 'arouse', 'magnificent', 'remarkable', 'schoolwork', 'ease', 'devil', 'factor', 'outstanding', 'infinite', 'infinitely', 'accomplish', 'accomplished', 'mission', 'investigate', 'mysterious', 'analysis', 'peak', 'excellence', 'credit', 'responsibility', 'amount', 'entertain', 'alternative', 'irregular', 'grant', 'cease', 'concentration', 'adapt', 'weird', 'profit', 'alter', 'performance', 'echo', 'hallway', 'await', 'abortion', 'database', 'available', 'indecision', 'ban', 'predict', 'breakthrough', 'fate', 'host', 'pose', 'instance', 'expert', 'surgery', 'naval', 'aircraft', 'target', 'spoonful', 'navigation', 'numerous', 'fluent', 'mechanic', 'advertise', 'advertising', 'waken', 'enormous', 'enormously', 'oversleep', 'survey', 'best-selling', 'filmmaker', 'prosperous', 'involve']
    let phrases = ['Yes, he is', 'No, he isn\'t', 'Yes', 'No']
    let getRanWord = ()=> { return vocabulary[parseInt(Math.random()*vocabulary.length)] }
    let getRanPhrase = ()=> { return phrases[parseInt(Math.random()*phrases.length)] }
    let sleep = (ms)=> { return new Promise(resolve => setTimeout(resolve, ms)); }
    let click_btn = ()=> { $('.wy-course-bottom .wy-course-btn-right .wy-btn').click(); }
    let config = {
        'autodo': ['auto_tiankong', 'auto_luyin', 'auto_lytk', 'auto_roleplay', 'auto_danxuan'],
        'autotryerr': true,
        'autostop': false,
        'delay': 10000
    };

    function input_in(e, txt) {
        if (e.type == 'textarea') {
            e.value= txt;
        } else {
            e.innerText= txt;
        }

        let changeEvent = null;
        changeEvent = document.createEvent ("HTMLEvents");
        changeEvent.initEvent ("input", true, true);
        e.dispatchEvent (changeEvent);

        changeEvent = document.createEvent ("HTMLEvents");
        changeEvent.initEvent ("keyup", true, true);
        e.dispatchEvent (changeEvent);

        changeEvent = document.createEvent ("HTMLEvents");
        changeEvent.initEvent ("change", true, true);
        e.dispatchEvent (changeEvent);
    }

    async function doTopic() {
        let setTixing = async (t)=> {
            console.log('[+] 题型:', t);
            $('#yun_status').text('当前题型：'+t);
            await sleep(config.delay) // 挂机10s，增加时长
        }; 

        if($('.wy-course-bottom .wy-course-btn-right .wy-btn').text().indexOf('Submit')==-1) {
            $('.page-next')[1].click();
            await sleep(1500)
        }

        if($('img[title="录音"]').length!=0 && config.autodo.includes('auto_luyin')) {
            await setTixing('录音');
            await doReadRepeat();
        } else if($('.lib-textarea-container').length!=0 && config.autodo.includes('auto_lytk')) {
            await setTixing('听力填空');
            await doListenAnswer();
        } else if($('.lib-fill-blank-do-input-left').length!=0 && config.autodo.includes('auto_tiankong')) {
            await setTixing('填空');
            await doTianKone();
        } else if($('.lib-single-item-img').length!=0 && config.autodo.includes('auto_danxuan')) {
            await setTixing('单选');
            await doSingleChoose();
        } else if($('.lib-role-select-item').length!=0 && config.autodo.includes('auto_roleplay')) {
            await setTixing('角色扮演');
            await doRolePlay();
        } else {
            await unSupposedOrSkip();
            return false;
        }

        return true;
    }

    // ===========================================

    // 填空题
    async function doTianKone() {
        // 先填写随机单词，获得答案

        let inputs = $('.lib-fill-blank-do-input-left');
        $.each(inputs, function(i,item){
            input_in(item, getRanWord());
        });
        
        await sleep(500);
        click_btn(); // Submit
        await sleep(2000);

        let answer = [], anyAnswer = false;
        $('.lib-edit-score span[data-type="1"]').each((i,item)=>{
            if(item.innerText.toLowerCase().indexOf('may vary')!=-1) {
                // 任意填空
                anyAnswer = true;
                return false;
            }
            answer.push(item.innerText)
        });
        
        if(anyAnswer) {
            return;
        }

        click_btn(); // Retry
        await sleep(2000);

        // 提交正确答案
        inputs = $('.lib-fill-blank-do-input-left');
        $(inputs).each((i,item)=>{
            input_in(item, answer[i]);
        });
        
        await sleep(500);
        click_btn(); // Submit
    }

    // 录音题
    async function doReadRepeat() {
        let sum_record = 0;

        if($('.lib-oral-container-top').length!=0) {
            var rec_div = $('.lib-oral-container-top')
        } else {
            var rec_div = $('.lib-listen-item-right-img')
        }
        
        rec_div.each((i,div)=>{
            if($(div).find('img[title="播放"]').length!=0){
                return true;
            };
        
            let click_record = (e) => { 
                console.log('click:', e);
                $(e).find('img[title="录音"],img[title="停止"]').click();
            }
            
            setTimeout(()=>{click_record(div);}, sum_record*5000);
            setTimeout(()=>{click_record(div);}, 3000 + sum_record*5000);
            sum_record ++;
        });
        await sleep(2000 + sum_record*5000)
        click_btn(); // Submit
        await sleep(3000)
    }

    // 单选题
    async function doSingleChoose() {
        let answer_map = {'A':0, 'B':1, 'C':2, 'D':3, 'E':4, 'F':5}

        // 随机选择以获得正确答案
        $('.lib-single-item-img img').click()
        
        await sleep(500);
        click_btn(); // Submit
        await sleep(2000);

        let answer = []
        $('.lib-single-cs-answer').each((i,item)=>{
            answer.push(item.innerText)
        });

        click_btn(); // Retry
        await sleep(2000);

        $('.lib-single-box').each((i,item)=>{
            $($(item).find('.lib-single-item')[answer_map[answer[i]]]).find('img').click()
        });

        await sleep(500);
        click_btn(); // Submit
    }

    // 角色扮演
    async function doRolePlay() {
        $('.lib-role-select-item img')[0].click()
        $('.lib-role-select-start button').click()

        await sleep(30000);
        click_btn(); // Submit
    }

    // 听力填空
    async function doListenAnswer() {
        let inputs = $('.lib-textarea-container');
        $.each(inputs, function(i,item){
            input_in(item, getRanPhrase());
        });
        
        await sleep(500);
        click_btn(); // Submit
    }

    // 不支持体型
    async function unSupposedOrSkip(params) {
        console.log('[!]', '遇到不支持体型或未选择，自动跳过。。。');
    }
    // ===========================================

    let running = false;

    async function initConf() {
        config = await GM.getValue('config', config);

        $.each(config.autodo, (index, id)=>{
            $('#'+id).prop("checked",true);
        });
        $('#set_tryerr').prop("checked", config.autotryerr);
        $('#set_manu').prop("checked", config.autostop);
        $('#set_delay').val(config.delay);
    }

    async function doLoop() {
        while (running) {
            let status = await doTopic();
            if(!status && config.autostop) {
                $('#yun_status').text('不支持当前体型, 已停止');
                break;
            }
            console.log('[*]', '已完成，切换下一题。。。');
            await sleep(1500);
            $('.page-next')[1].click()
            await sleep(5000); 
        }
        $('.yunPanel button').prop('disabled', false);
        $('#yun_status').text('IDLE');
    }

    $(`<style>.yunPanel input[type="checkbox"]{margin-left: 10px;}.yunPanel h3,.yunPanel input,.yunPanel label{font-size:smaller}.yunPanel p{margin:10px 0}.yunPanel{padding:10px 20px;position:fixed;top:100px;right:150px;height:370px;width:200px;border:1px solid #000;background-color:#fcff6680;z-index:9999}.yunPanel .close{position:absolute;cursor:pointer;top:8px;right:10px}.yunPanel .close:hover{color:#00000088}</style>`).appendTo("head");
    $(document.body).after(`
        <div class="yunPanel">
        <div class="close">x</div>
        <h1 style="text-align: center;font-size: medium;">社听说 - 自动答题</h1>
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
        </p>
        <h2 style="font-size: small;">设置</h2>
        <p>
            <p>
                <input type="checkbox" id="set_tryerr">
                <label for="set_tryerr">自动试错</label>
                <input type="checkbox" id="set_manu">
                <label for="set_manu">不支持题型停止</label>
            </p>
            <label>每题耗时(ms) <input style="width: 50px;" type="text" id="set_delay"></label>
            <button id="yun_save" style="float: left;margin-top:5px;width: 48%;">保存</button>
            <button id="yun_reset" style="float: right;margin-top:5px;width: 48%;">默认</button>
            <div style="clear: both;"></div>
        </p>
        <hr>
        <h2 id="yun_status" style="font-size: small;text-align: center;margin-bottom:8px;">IDLE</h2>
        <button id="yun_doone" style="width: 100%;margin-bottom: 3px;">做一题</button>
        <button id="yun_start" style="width: 100%;">开始</button>
        </div>
    `);

    $('#yun_start').click(()=>{
        if($('#yun_start').text()=='开始') {
            $('#yun_doone').prop('disabled', true);
            running = true;
            doLoop();
            $('#yun_start').text('停止')
        } else {
            $('.yunPanel button').prop('disabled', true);
            running = false;
            $('#yun_start').text('开始')
        }
    });

    $('#yun_doone').click(()=>{
        $('#yun_start').text('开始');
        running = false;
        $('.yunPanel button').prop('disabled', true);
        doTopic().then(()=>{
            $('.yunPanel button').prop('disabled', false);
            $('#yun_status').text('Done!');
        });
        
    });
    $('.yunPanel .close').click(()=>{$('.yunPanel').hide()});
    $('#yun_reset').click(()=>{ GM.deleteValue('config'); window.location.reload(); });
    $('#yun_save').click(()=>{
        let ids = config.autodo.slice()
        config.autodo = []
        $.each(ids, (index, id)=>{
            if($('#'+id).prop("checked")) {
                config.autodo.push(id);
            }
        });
        config.autotryerr = $('#set_tryerr').prop("checked");
        config.autostop = $('#set_manu').prop("checked");
        config.delay = $('#set_delay').val();
        GM.setValue('config', config);
        $('#yun_status').text('保存成功');
    });
    

    initConf();
    // Your code here...
})();