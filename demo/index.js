/**
 * Created by hugh on 16/12/26.
 */
!(function(){
    jsErrorReport({
        url:'',//上报地址,
        moduleName:'',//上报模块名
        data:{

        }//额外信息
    });
    //语法错误
    var test;
    test();
    //ajax错误
    $.ajax({
       url:'https://e.dianping.com/1',
        data:{},
        method:'GET'
    });
    $.ajax({
        url:'https://e.dianping.com/2',
        data:{},
        method:'GET'
    });

    //jsonp错误

}());