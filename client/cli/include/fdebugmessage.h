#ifndef FDEBUGMESSAGE_H_
#define FDEBUGMESSAGE_H_

#include "cJSON.h"

class fDebugMessage {
private:
	bool parse(char *message);
	char *json;
	char *type;
	cJSON *payload;
	
public:
	fDebugMessage(char *message);
	char* getType();
	cJSON* getPayload();
};

#endif /*FDEBUGMESSAGE_H_*/
