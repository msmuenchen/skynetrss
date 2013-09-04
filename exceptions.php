<?
//Not valid XML
class XMLParseException extends Exception {
}
//Invalid feed type
class WrongFormatException extends Exception {
}
//Critical elements missing while feed parsing
class MalformedFeedException extends Exception {
}
//wrong or missing API parameters
class APIWrongCallException extends Exception {
}

//Permission denied (user not subscribed to this feed id!)
class PermissionDeniedException extends Exception {
}

//File/URL loading failed
class FileLoadException extends Exception {
}

//Item already in DB
class AlreadyPresentException extends Exception {
}

//pseudo exception for login-exceptions like wrong username/password
class LoginException extends Exception {
}

//cURL exception
class CURLException extends Exception {
  function __construct($msg,$c) {
    $msg.=": ".curl_error($c);
    parent::__construct($msg);
  }
}

//cURL server exception
class CURLDownloadException extends Exception {
  public $rc;
  function __construct($rc) {
    $this->rc=$rc;
    parent::__construct("HTTP return code: $rc");
  }
}