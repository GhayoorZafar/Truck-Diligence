
function ourcook() {
var str = location.href;      
var d = new Date();
d.setTime(d.getTime() + (180*24*60*60*1000)); //180 days
var expires = d.toUTCString();

if(str.indexOf("?") > 0 && document.cookie.indexOf('SEARCHTERM') == -1) //has a query string and we don't have a value yet.
   {
   str = str.substring(str.indexOf("?"),str.length);
   str = escape(str);
   str = str.replace(/\//g,"%2F");
   str = str.replace(/ /g,"+");
   str = str.replace(/\?/g,"%3F");
   str = str.replace(/=/g,"%3D");
   str = str.replace(/&/g,"%26");
   str = str.replace(/@/g,"%40");
   document.cookie = "SEARCHTERM="+ str + "; expires=" + expires + "; path=/; secure; SameSite=None; domain=.directfreight.com; ";
   }
str = document.referrer;
if((str.length > 0) && (document.cookie.indexOf('REFERRER') == -1))
   {
   str = escape(str);
   str = str.replace(/\//g,"%2F");
   str = str.replace(/ /g,"+");
   str = str.replace(/\?/g,"%3F");
   str = str.replace(/=/g,"%3D");
   str = str.replace(/&/g,"%26");
   str = str.replace(/@/g,"%40");
   document.cookie = "REFERRER="+ str + "; expires=" + expires + "; path=/; secure; SameSite=None; domain=.directfreight.com; ";
   }
}

setTimeout("ourcook()", 100);
