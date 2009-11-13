//#include "string.h"
//#include <stdio.h>
#include "fdebugexception.h"

fDebugException::fDebugException(const char * message) {
	this->message = (char*) message;
}

char* fDebugException::getMessage() {
	return this->message;
}