# jsErrorReport

这是一个js错误监控模块（包括js语法错误，ajax请求，静态资源加载错误），在页面最开始加载对应的js，全局初始化jsErrorReport，页面内的js错误信息将发送给后台。

## 引入方式

     $ npm install js-error-report --save //安装

     require('js-error-report')
     或者
     import 'js-error-report';

## 初始化
在所有js的最开始进行初始化

    jsErrorReport({
        url:'',//上报地址
        moduleName:'',//上报模块名
        data:{}//自定义参数
    });
