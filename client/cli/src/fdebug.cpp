#include <iostream>
#include <getopt.h>
#include "string.h"
#include <stdlib.h>

#include "fdebugsocket.h"
#include "fdebugclient.h"
#include "cJSON.h"

#include "fdebugconfig.h"
#include "fdebugexception.h"

using namespace std;

int main(int argc, char **argv) {
	char in[2];
	printf(BOLD "fDebug Client %s by virus-d\n\n" NORMAL, FDEBUG_VERSION);
	
	// init fdebug config
	fDebugConfig *config = fDebugConfig::getInstance();
	config->init(argc, argv);
	
	// create new socket
	fDebugSocket *socket = new fDebugSocket(config->getPort());
	
	while (1) {
		try {
			fDebugClient *client = socket->waitForClient();
			
			// need to confirm new connections?
			if (config->options.strict) {
				printf("Accept incoming connection from %s ? [N/y]", client->getRemoteAddress());
				cin.getline(in, 2, '\n');
				if (strcasecmp(in, (const char*)"Y") != 0) {
					client->closeSocket();
					delete client;
					continue;
				}
			}
			
			//TODO: verify client (allowed hosts?)
			if (!client->process()) {
				printf("Handling request failed!\n");
				client->closeSocket();
			}
			
			delete client;
		} catch(fDebugException e) {
			printf("Exception caught: %s", e.getMessage());
			exit(1);
		}
	}
	
	delete socket;
	return 0;
}
