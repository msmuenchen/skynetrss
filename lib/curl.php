<?
class CURL {
  private $c;
  private static $inst=null;
  public function __construct() {
    $this->c=curl_init();
    curl_setopt($this->c,CURLOPT_RETURNTRANSFER,true);
    curl_setopt($this->c,CURLOPT_FOLLOWLOCATION,true);
    curl_setopt($this->c,CURLOPT_SSL_VERIFYPEER,false);
    curl_setopt($this->c,CURLOPT_SSL_VERIFYHOST,0);
    curl_setopt($this->c,CURLOPT_USERAGENT,"SKYRSS Reader/Aggregator");
  }
  public static function getInst() {
    if(static::$inst==null)
      static::$inst=new static();
    return static::$inst;
  }
  public static function get($url) {
    $scheme=parse_url($url,PHP_URL_SCHEME);
//TODO THIS IS UGLY
    if($scheme=="") { $scheme="http"; $url="http:".$url; }//protocol-relative URLs default to http
    if(!in_array($scheme,array("http","https","ftp")))
      throw new PermissionDeniedException("Ungültige URL");
    
    $inst=static::getInst();
    $r=curl_setopt($inst->c,CURLOPT_HTTPGET,true);
    if($r===false)
      throw new CURLException("curl_setopt(HTTPGET) failed",$inst->c);
    curl_setopt($inst->c, CURLOPT_URL, $url);
    if($r===false)
      throw new CURLException("curl_setopt(URL) failed",$inst->c);
    curl_setopt($inst->c, CURLOPT_HEADER, false);
    if($r===false)
      throw new CURLException("curl_setopt(HEADER) failed",$inst->c);
    
    $ret=curl_exec($inst->c);
    if($ret===false)
      throw new CURLException("curl_exec failed",$inst->c);
    
    $rc=curl_getinfo($inst->c,CURLINFO_HTTP_CODE);
    if($rc===false)
      throw new CURLException("curl_getinfo(HTTPCODE) failed",$inst->c);
    if($rc!=200)
      throw new CURLDownloadException($rc);
    return $ret;
  }
}
