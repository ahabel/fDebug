#include "string.h"
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>

#include "fdebugexception.h"
#include "fdebugconfig.h"
#include "fdebugclient.h"
#include "fdebugmessage.h"
#include "fdebugcli.h"
#include "cJSON.h"


fDebugClient::fDebugClient(int socket, sockaddr_in addr) {
	this->sock     = socket;
	this->cli_addr = addr;
}

char* fDebugClient::getServer() {
	return this->server;
}

char* fDebugClient::getURL() {
	return this->url;
}

char* fDebugClient::getRemoteAddress() {
	return inet_ntoa(this->cli_addr.sin_addr);
}

bool fDebugClient::process() {
	fDebugCli *handler = new fDebugCli();
	
	if (!this->clientHasData()) {
		printf("No data from client\n");
		return false;
	}
	
	if (!this->init()) {
		printf("Initializing client failed\n");
		return false;
	}
	
	while (this->clientHasData()) {
		try {
			fDebugMessage *message = new fDebugMessage(this->buffer);
			handler->process(message);
			delete message;
			this->clearBuffer();
		} catch(fDebugException e) {
			printf("MESSAGE ERROR: %s\n", e.getMessage());
		}
	}
	
	delete handler;
	return true;
}

bool fDebugClient::init() {
	// {"type":"CONTROL","payload":{"action":"HELO","url":"\/de\/site\/index.xml","server":"bluepoints.mobile"}}
	
	cJSON *root = cJSON_Parse(this->buffer);
	if (root->type != 6) {
		// message is not an json object / 6 = CJSON_OBJECT
		printf("ERROR: parsing json failed: %s\n", this->buffer);
		return false;
	}
	
	cJSON *payload = cJSON_GetObjectItem(root, "payload");
	char *action   = cJSON_GetObjectItem(payload, "action")->valuestring;
	this->server   = cJSON_GetObjectItem(payload, "server")->valuestring;
	this->url      = cJSON_GetObjectItem(payload, "url")->valuestring;
	
	if (strcmp(action, "HELO") != 0) {
		printf("Client did not start with exptected HELO\n");
		return false;
	}
	
	printf("\n---------------------------------------------------------------------------------------\nConnection from %s (%s) (%s)\n", this->server, inet_ntoa(this->cli_addr.sin_addr), this->url);
	
	this->clearBuffer();
	return true;
}

bool fDebugClient::clientHasData() {
	char buf[20000];
	int bytes  = recv(this->sock, buf, sizeof(buf) - 1, 0);
	if (bytes == -1) {
		perror("recv failed");
		return false;
	}
	
	if (bytes == 0) {
		return false;
	}
	
	buf[bytes] = '\0';
	char *x;
	x = strtok(buf, "\r\n");
	sprintf(this->buffer, x);
	
	//printf("Recv: bytes rx: %d -- buffer: %i -- size: %i -- [%s]\n\n", bytes, strlen(this->buffer), sizeof(this->buffer), buf);
	
	// send OK to client
	this->sendMessage("OK\n");
	return true;
}

int fDebugClient::clearBuffer() {
	sprintf(this->buffer, "");
	return 0;
}

bool fDebugClient::sendMessage(const char *msg) {
	char buffer[1024];
	sprintf(buffer, msg, "\r\n");
	int bytes = send(this->sock, buffer, strlen(buffer), 0);
	if (bytes == -1) {
		perror("Sending to socket failed");
		return false;
	}
	
	return true;
}

void fDebugClient::closeSocket() {
	shutdown(this->sock, SHUT_RDWR);
}


