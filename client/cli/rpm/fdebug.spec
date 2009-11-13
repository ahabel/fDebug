Name:           fdebug
Version:        0.1
Release:        1
Summary:        fDebug Commandline Client

Group:		    Utilities/System
License:        fpl

BuildRoot:      /tmp/fdebugbuild
BuildRequires:  libxml2

Source: 	fdebug.tar.gz

%description


%prep
%setup -n %{name}


%build
cd Release
make all


%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/usr/bin

install -m 777 Release/fdebug $RPM_BUILD_ROOT/usr/bin/fdebug


%clean
rm -rf $RPM_BUILD_ROOT

%files
#%defattr(-,root,root,-)

%attr(665,root,root) /usr/bin/fdebug
