<?
$url=$_GET["url"];

try {
  $raw=CURL::get($url);
} catch(CURLDownloadException $e) {
  throw new FileLoadException();
} catch(PermissionDeniedException $e) {
  try {
    $scheme=parse_url($url,PHP_URL_SCHEME);
    if($scheme=="")
      $url="http://$url";
    $raw=CURL::get($url);
  } catch(Exception $e2) {
    throw new FileLoadException();
  }
}

//avoid stupid warnings caused by invalid HTML
libxml_use_internal_errors(true);
//First, try to load as XML (strict)
$doc = new DomDocumentCharset();
$rv=$doc->loadXML($raw);
if($rv===false) {
  $doc=new DOMDocumentCharset();
  $rv=$doc->loadHTMLCharset($raw);
  if($rv===false)
    throw new WrongFormatException("XML load failed");
}
libxml_use_internal_errors(false);

if(strtolower($doc->documentElement->tagName=="html")) {
  //get all link elements conforming to http://www.rssboard.org/rss-autodiscovery
  $xpath=new DOMXPath($doc);

  $res=$xpath->evaluate('//link[@type="application/rss+xml" or @type="application/atom+xml"][@rel="alternate"]');
  $ret["feeds"]=array();
  for($i=0;$i<$res->length;$i++) {
    $item=$res->item($i);
    if(!$item->hasAttribute("href"))
      continue;
    $title="";
    if($item->hasAttribute("title"))
      $title=$item->getAttribute("title");
    $ret["feeds"][]=array("link"=>$item->getAttribute("href"),"title"=>$title);
  }
} elseif(strtolower($doc->documentElement->tagName=="rss")) {
  $feed=Feed::createFromText($url,$raw);
  $ret["feeds"][]=array("link"=>$url,"title"=>$feed->title);
} else {
  throw new WrongFormatException("Expected HTML, got ".$doc->documentElement->tagName);
}