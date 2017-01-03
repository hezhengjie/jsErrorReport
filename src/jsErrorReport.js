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
        t:'',	//发送数据时的时间戳
        n:'js',//模块名,
        l:'ERROR',//js日志错误级别，如warning, error, info, debug
        msg:'',  //错误的具体信息,
        a:navigator.appVersion,
        id:'1',
        data:{}
    };

    /*
     *格式化参数
     */
    function formatParams(data) {
        var arr = [];
        for (var name in data) {
            arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
        }
        return arr.join("&");
    }
    /*
     * 上报函数
     */
    function report(url,data){
        var img = new Image();
        img.src = url+'?v=1&' +formatParams(data) ;
    }

    /**
     * js错误监控
     **/
    var jsErrorReport=function(params){

        if(!params.url){return}
        defaults.n = params.moduleName;
        var url = params.url;

        //重写send方法,监控xhr请求
        var s_ajaxListener = new Object();
        s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;//复制原先的send方法
        s_ajaxListener.tempOpen= XMLHttpRequest.prototype.open;//复制原先的open方法
        //重写open方法,记录请求的url
        XMLHttpRequest.prototype.open = function(method,url,boolen){
            s_ajaxListener.tempOpen.apply(this, [method,url,boolen]);
            this.ajaxUrl = url;

        };
        XMLHttpRequest.prototype.send = function(_data){
            s_ajaxListener.tempSend.apply(this, [_data]);
            this.onreadystatechange = function(){
                if (this.readyState==4) {
                    if (status >= 200 && status < 300) {
                        return true;
                    }
                    else {
                        defaults.t =new Date().getTime();
                        defaults.msg = 'ajax请求错误';
                        defaults.data = JSON.stringify({
                            resourceUrl:this.ajaxUrl,
                            pageUrl:location.href,
                            category:'ajax',
                            text:this.statusText,
                            status:this.status
                        })
                        // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                        var reportData=Object.assign({},params.data || {},defaults);
                        // 把错误信息发送给后台
                        report(url,reportData)
                    }
                }
            }
        };

        //监控资源加载错误(img,script,css,以及jsonp)
        window.addEventListener('error',function(e){
            defaults.t =new Date().getTime();
            defaults.msg =e.target.localName+' is load error';
            defaults.data = JSON.stringify({
               target: e.target.localName,
               type: e.type,
               resourceUrl:e.target.currentSrc,
               pageUrl:location.href,
               category:'resource'
           });
            if(e.target!=window){//抛去js语法错误
                // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                var reportData=Object.assign({},params.data || {},defaults);

                // 把错误信息发送给后台
                report(url,reportData)
            }


        },true);

        //监控js错误
        window.onerror = function(msg,_url,line,col,error){
            //采用异步的方式,避免阻塞
            setTimeout(function(){
                //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
                col = col || (window.event && window.event.errorCharacter) || 0;
                if (error && error.stack){
                    //msg信息较少,如果浏览器有追溯栈信息,使用追溯栈信息
                    defaults.msg = error.stack.toString();

                }else{
                    defaults.msg = msg;
                }
                defaults.data=JSON.stringify({
                    resourceUrl:_url,
                    pageUrl:location.href,
                    category:'js error',
                    line:line,
                    col:col
                });
                defaults.t=new Date().getTime();
                defaults.level='error';
                // 合并上报的数据，包括默认上报的数据和自定义上报的数据
                var reportData=Object.assign({},params.data || {},defaults);
                // 把错误信息发送给后台
                report(url,reportData)
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