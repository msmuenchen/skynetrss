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
