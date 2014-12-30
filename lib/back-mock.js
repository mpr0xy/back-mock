module.exports = function(host, port, apiDir, allowedHeaders) {

  var fs = require('fs');
  var path = require('path');
  var app = require('express')();
  var bodyParser = require('body-parser');
  var multer = require('multer');

  // 加入解析body的中间件
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer());

  // 允许ajax跨域任意访问
  app.use(function (req, res, next) {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': (typeof allowedHeaders != 'undefined') ? allowedHeaders : 'content-type'
    });
    next();
  });

  // 读取指定目录的文件
  var mockFiles = fs.readdirSync(apiDir);

  // 为每个文件生成
  for (var i = 0; i < mockFiles.length; i++){
    if (path.extname(mockFiles[i]) != '.js') {
      continue;
    }

    console.log(mockFiles[i]);

    // 读取每个文件
    var eachModule = require(path.join(apiDir, mockFiles[i]));
    // 获得每个模拟Api对象
    for (var item in eachModule) {
      var itemApi = eachModule[item];
      // 暂时不支持正则路径匹配
      (function(_itemApi){
        app.all(_itemApi.path, function(req, res){
          var method = req.method;
          // 打印访问日志
          console.log('Processing '+ method +' request on http://'+ req.hostname +':'+ port + req.originalUrl);
          if (_itemApi[method]){
            var result = {
              'data': _itemApi[method](req),
              'status': 'ok',
              'description': 'no error'
            };
            return res.json(result);
          }
        });
      })(itemApi)
    }
  }
  app.listen(port, host);
  console.log('back-mock start：http://'+ host + ':' + port);
}



