/**
 * Created by hugh on 16/12/26.
 */

;(function(){

    'use strict';

    if (window.jsErrorReport){
        return window.jsErrorReport
    };

    /*
     *  默认上报的错误信息
     */
    var defaults = {
        msg:'',  //错误的具体信息
        url:'',  //错误所在的url
        line:'', //错误所在的行
        col:'',  //错误所在的列
        error:'', //具体的error对象,
        resourceUrl:'',	//资源URL，对应一个Ajax请求、css或js资源的具体URL
        pageUrl:'',	//资源所属页面的URL
        timestamp:'',	//发送数据时的时间戳
        category:'',//	错误日志的类型。如图片报错，为一个单独的分类。
        level:'',//	js日志错误级别，如warning, error, info, debug
        rawLog:''
    };

    /*
     *ajax封装
     */
    function ajax(options) {
        options = options || {};
        options.type = (options.type || "GET").toUpperCase();
        options.dataType = options.dataType || "json";
        var params = formatParams(options.data);

        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
        } else {
            var xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                var status = xhr.status;
                if (status >= 200 && status < 300) {
                    options.success && options.success(xhr.responseText, xhr.responseXML);
                } else {
                    options.fail && options.fail(status);
                }
            }
        }

        if (options.type == "GET") {
            xhr.open("GET", options.url + "?" + params, true);
            xhr.send(null);
        } else if (options.type == "POST") {
            xhr.open("POST", options.url, true);
            //设置表单提交时的内容类型
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(params);

        }
    }

    /*
     *格式化参数
     */
    function formatParams(data) {
        var arr = [];
        for (var name in data) {
            arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
        }
        arr.push(("v=" + Math.random()).replace(".",""));
        return arr.join("&");
    }
    /*
     * 上报函数
     */
    function report(url,data,successCallBack,failCallBack){
        ajax({
            url: url,      //请求地址
            type: "POST",         //请求方式
            data: data,     //请求参数
            dataType: "json",
            success: function (response, xml) {
                // 此处放成功后执行的代码
                successCallBack&&successCallBack(response, xml);
            },
            fail: function (status) {
                // 此处放失败后执行的代码
                failCallBack&&failCallBack(status);
            }
        });
    }

    /**
     * js错误监控
     **/
    var jsErrorReport=function(params){

        if(!params.url){return}

        //重写send方法,监控xhr请求
        var s_ajaxListener = new Object();
        s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;//复制原先的send方法
        XMLHttpRequest.prototype.send = function(_data){
            s_ajaxListener.tempSend.apply(this, [_data]);
            this.onreadystatechange = function(){
                if (this.readyState==4) {
                    if (status >= 200 && status < 300) {
                        return true;
                    }
                    else {
                        var data = {
                            resourceUrl:this.responseXML,
                            pageUrl:location.href,
                            timestamp:new Date().getTime(),
                            category:'ajax',
                            level:'error',
                            rawLog:this.statusText,
                            responseXML:this.responseXML,
                            status:this.status
                        }
                        // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                        var reportData=Object.assign({},params.data || {},data);
                        // 把错误信息发送给后台
                        alert(JSON.stringify(reportData));
                    }
                }
            }
        };

        //监控资源加载错误(img,script,css,以及jsonp)
        window.addEventListener('error',function(e){
           var data = {
               target: e.target.localName,
               type: e.type,
               resourceUrl:e.target.currentSrc,
               pageUrl:location.href,
               timestamp:new Date().getTime(),
               category:'resource',
               level:'error',
               rawLog:e.target.localName+' is load error'
           };
            if(e.target!=window){//抛去js语法错误
                // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                var reportData=Object.assign({},params.data || {},data);

                // 把错误信息发送给后台
                alert(JSON.stringify(reportData));
            }


        },true);

        //监控js错误
        window.onerror = function(msg,url,line,col,error){
            //采用异步的方式,避免阻塞
            setTimeout(function(){
                //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
                col = col || (window.event && window.event.errorCharacter) || 0;
                defaults.url = url;
                defaults.line = line;
                defaults.col =  col;
                if (error && error.stack){
                    //msg信息较少,如果浏览器有追溯栈信息,使用追溯栈信息
                    defaults.msg = error.stack.toString();

                }else{
                    defaults.msg = msg;
                }
                defaults.resourceUrl=defaults.url;
                defaults.pageUrl=location.href;
                defaults.timestamp=new Date().getTime();
                defaults.category='js error';
                defaults.level='error';
                defaults.rawLog=defaults.msg;
                // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                var reportData=Object.assign({},params.data || {},defaults);
                // 把错误信息发送给后台
                alert(JSON.stringify(reportData));
                //report(params.url,reportData,params.successCallBack,params.failCallBack);
            },0);

            return true;   //错误不会console浏览器上,如需要，可将这样注释
        };

    }

    window.jsErrorReport=jsErrorReport;

})();

/*===========================
 jsErrorReport AMD Export
 ===========================*/
if (typeof(module) !== 'undefined'){
    module.exports = window.jsErrorReport;
}
else if (typeof define === 'function' && define.amd) {
    define([], function () {
        'use strict';
        return window.jsErrorReport;
    });
}