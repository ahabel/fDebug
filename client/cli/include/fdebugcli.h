#ifndef FDEBUGCLI_H_
#define FDEBUGCLI_H_

#include <netinet/in.h>
#include "fdebugmessage.h"
#include "fdebugconfig.h"

#include "libxml2/libxml/tree.h"

class fDebugCli {
public:
	fDebugCli();
	bool process(fDebugMessage *message);
private:
	void handleControl(fDebugMessage *message);
	void handleMessage(fDebugMessage *message);
	void handleVariables(fDebugMessage *message);
	void processVariablesGroups(xmlNodePtr group);
	
	fDebugConfig *config;
};

#endif /*FDEBUGCLI_H_*/
