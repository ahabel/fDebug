RM := rm -rf

CPP_SRCS += \
./src/fdebug.cpp \
./src/fdebugcli.cpp \
./src/fdebugclient.cpp \
./src/fdebugconfig.cpp \
./src/fdebugexception.cpp \
./src/fdebugmessage.cpp \
./src/fdebugsocket.cpp 

C_SRCS += \
./src/cJSON.c 

OBJS += \
./objects/cJSON.o \
./objects/fdebug.o \
./objects/fdebugcli.o \
./objects/fdebugclient.o \
./objects/fdebugconfig.o \
./objects/fdebugexception.o \
./objects/fdebugmessage.o \
./objects/fdebugsocket.o 

C_DEPS += \
./objects/cJSON.d 

CPP_DEPS += \
./objects/fdebug.d \
./objects/fdebugcli.d \
./objects/fdebugclient.d \
./objects/fdebugconfig.d \
./objects/fdebugexception.d \
./objects/fdebugmessage.d \
./objects/fdebugsocket.d 


objects/%.o: ./src/%.c
	gcc -I"./include" -O3 -c -fmessage-length=0 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -o"$@" "$<"

#src/fdebug.o: ../src/fdebug.cpp
#	g++ -I"../include" -I/usr/include/libxml2 -O2 -g -c -fmessage-length=0 -MMD -MP -MF"$(@:%.o=%.d)" -MT"src/fdebug.d" -o"$@" "$<"

objects/%.o: ./src/%.cpp
	g++ -I"./include" -I/usr/include/libxml2 -O3 -g -c -fmessage-length=0 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -o"$@" "$<"




ifneq ($(MAKECMDGOALS),clean)
ifneq ($(strip $(C++_DEPS)),)
-include $(C++_DEPS)
endif
ifneq ($(strip $(C_DEPS)),)
-include $(C_DEPS)
endif
ifneq ($(strip $(CC_DEPS)),)
-include $(CC_DEPS)
endif
ifneq ($(strip $(CPP_DEPS)),)
-include $(CPP_DEPS)
endif
ifneq ($(strip $(CXX_DEPS)),)
-include $(CXX_DEPS)
endif
ifneq ($(strip $(C_UPPER_DEPS)),)
-include $(C_UPPER_DEPS)
endif
endif

all: fdebug

fdebug: $(OBJS) $(USER_OBJS)
	g++ `xml2-config --cflags --libs` -o"fdebug" $(OBJS) $(USER_OBJS) $(LIBS)

clean:
	-$(RM) $(OBJS)$(C++_DEPS)$(C_DEPS)$(CC_DEPS)$(CPP_DEPS)$(EXECUTABLES)$(CXX_DEPS)$(C_UPPER_DEPS) fdebug
	-@echo ' '


.PHONY: all clean dependents
.SECONDARY:
