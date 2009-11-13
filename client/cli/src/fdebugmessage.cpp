#include "string.h"
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>

#include "fdebugexception.h"
#include "fdebugmessage.h"
#include "cJSON.h"


fDebugMessage::fDebugMessage(char *message) {
	this->parse(message);
}

bool fDebugMessage::parse(char *message) {
	cJSON *root = cJSON_Parse(message);
	if (root->type != 6) {
		// message is not an json object / 6 = CJSON_OBJECT
		throw fDebugException("Parsing json failed");
	}
	
	char *type = cJSON_GetObjectItem(root, "type")->valuestring;
	// TODO: type validity check
	
	this->json    = message;
	this->type    = type;
	this->payload = cJSON_GetObjectItem(root, "payload");
	
	delete root;
	return true;
}

char* fDebugMessage::getType() {
	return this->type;
}

cJSON* fDebugMessage::getPayload() {
	return this->payload;
}
