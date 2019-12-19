var http = require('http')
var parseUrl = require('parseurl')
var send = require('send')
var fs = require('fs');
var escapeHtml = require('escape-html');
var path_util =  require('path');

// get root path from command line args or use default setting
var rootPath = '/media/pi/HDD/'; // default root
var args = process.argv.slice(2); // first two args are always node + filename
if (args && args.length) {
   rootPath = args.[0];
   
   // validate that this is a valid directory path
   var validPath = fs.existsSync(rootPath) && fs.statSync(filepath).isDir();
   if (validPath && rootPath.substr(-1) !== '/') {
      rootPath += '/';
   } else if (!validPath) {
      console.log('Invalid root path ' + rootPath + '. Failed to start.');
      return;
   }
}

var server = http.createServer(function onRequest (req, res) {
   // your custom error-handling logic:
   function error (err) {
      res.statusCode = err.status || 500
      res.end(err.message)
   }

   // your custom headers
   function headers (res, path, stat) {
      // serve all files for download
      res.setHeader('Content-Disposition', 'attachment')
   }

   var video_formats = ['.mp4', '.avi', '.mkv'];
   function file (fullpath, stat) {
      var ext = path_util.extname(fullpath);
      if (video_formats.includes(ext) && !returnVideo) {
         res.setHeader('Content-Type', 'text/html; charset=UTF-8')

	 var buf = '<ul><li><a href="..">..</a></li></ul>';
	 buf += '<video id="videoPlayer" controls> <source src="' + path + '?video=true' + '" type="video/mp4"> </video>';

	 var template = '<!DOCTYPE html>\n' +
    	    '<html lang="en">\n' +
	    '<head>\n' +
	    '<meta charset="utf-8">\n' +
	    '<title>' + 'Pi Server' + '</title>\n' +
	    '</head>\n' +
	    '<body>\n' +
	    buf + '\n' +
	    '</body>\n' +
	    '</html>\n';

	 res.end(template);
      }
   }

   // Custom directory handler
   function directory (res, path) {
      var stream = this

      // redirect to trailing slash for consistent url
      if (!stream.hasTrailingSlash()) {
      return stream.redirect(path)
   }

   // get directory list
   fs.readdir(path, function onReaddir (err, list) {
      if (err) return stream.error(err)

      // render an index for the directory
      res.setHeader('Content-Type', 'text/html; charset=UTF-8')

      var buf = '<ul>';
      buf += '<li><a href = \'' + escapeHtml('..') + '\'>' + escapeHtml('..') +  '</a></li>';
      for (var i = 0; i < list.length; i++) {
         var fname = list[i];
         var filepath = path + fname;
	 if (!fs.statSync(filepath).isFile() && fname.substr(-1) !== '/') {
            fname += '/';
	 }

         buf += '<li><a href=\'' + escapeHtml(fname) + '\'>' + escapeHtml(fname) + '</a></li>';
      }

      buf += '</ul>';

      var template = '<!DOCTYPE html>\n' +
                     '<html lang="en">\n' +
		     '<head>\n' +
		     '<meta charset="utf-8">\n' +
		     '<title>' + 'Pi Server' + '</title>\n' +
		     '</head>\n' +
		     '<body>\n' +
		     buf + '\n' +
		     '</body>\n' +
		     '</html>\n';

		     res.end(template);
		     ///res.end(list.join('\n') + 'n')
      })
   }

   var originalUrl = parseUrl.original(req)
   var path = parseUrl(req).pathname;

   var returnVideo = false;
   if (originalUrl.query && originalUrl.query == 'video=true') {
      returnVideo = true;
   console.log('got video request');
   }


   // make sure redirect occurs at mount
   if (path === '/' && originalUrl.pathname.substr(-1) !== '/') {
      path = '';
   }

   // transfer arbitrary files
   send(req, path, { index: false, root: rootPath })
     .on('error', error)
     .on('directory', directory)
     .on('headers', headers)
     .on('file', file)
     .pipe(res)
})

server.listen(8080)
