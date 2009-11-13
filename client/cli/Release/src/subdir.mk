################################################################################
# Automatically-generated file. Do not edit!
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
CPP_SRCS += \
../src/fdebug.cpp \
../src/fdebugcli.cpp \
../src/fdebugclient.cpp \
../src/fdebugconfig.cpp \
../src/fdebugexception.cpp \
../src/fdebugmessage.cpp \
../src/fdebugsocket.cpp 

C_SRCS += \
../src/cJSON.c 

OBJS += \
./src/cJSON.o \
./src/fdebug.o \
./src/fdebugcli.o \
./src/fdebugclient.o \
./src/fdebugconfig.o \
./src/fdebugexception.o \
./src/fdebugmessage.o \
./src/fdebugsocket.o 

C_DEPS += \
./src/cJSON.d 

CPP_DEPS += \
./src/fdebug.d \
./src/fdebugcli.d \
./src/fdebugclient.d \
./src/fdebugconfig.d \
./src/fdebugexception.d \
./src/fdebugmessage.d \
./src/fdebugsocket.d 


# Each subdirectory must supply rules for building sources it contributes
src/%.o: ../src/%.c
	@echo 'Building file: $<'
	@echo 'Invoking: GCC C Compiler'
	gcc -I"/storage/webspace/fdebug/include" -O3 -Wall -c -fmessage-length=0 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -o"$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '

src/fdebug.o: ../src/fdebug.cpp
	@echo 'Building file: $<'
	@echo 'Invoking: GCC C++ Compiler'
	g++ -I"/storage/webspace/fdebug/include" -I/usr/include/libxml2 -O2 -g -Wall -c -fmessage-length=0 -MMD -MP -MF"$(@:%.o=%.d)" -MT"src/fdebug.d" -o"$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '

src/%.o: ../src/%.cpp
	@echo 'Building file: $<'
	@echo 'Invoking: GCC C++ Compiler'
	g++ -I"/storage/webspace/fdebug/include" -I/usr/include/libxml2 -O3 -Wall -c -fmessage-length=0 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@:%.o=%.d)" -o"$@" "$<"
	@echo 'Finished building: $<'
	@echo ' '


