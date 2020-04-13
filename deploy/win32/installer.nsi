RequestExecutionLevel User
InstallDir "$LocalAppData\PolygonLauncher"
!define UninstId "66a8279a-cf50-44f4-b4b8-57506d26e8e7" ; You might want to use a GUID here

!include LogicLib.nsh


!macro UninstallExisting exitcode uninstcommand
Push `${uninstcommand}`
Call UninstallExisting
Pop ${exitcode}
!macroend
Function UninstallExisting
Exch $1 ; uninstcommand
Push $2 ; Uninstaller
Push $3 ; Len
StrCpy $3 ""
StrCpy $2 $1 1
StrCmp $2 '"' qloop sloop
sloop:
	StrCpy $2 $1 1 $3
	IntOp $3 $3 + 1
	StrCmp $2 "" +2
	StrCmp $2 ' ' 0 sloop
	IntOp $3 $3 - 1
	Goto run
qloop:
	StrCmp $3 "" 0 +2
	StrCpy $1 $1 "" 1 ; Remove initial quote
	IntOp $3 $3 + 1
	StrCpy $2 $1 1 $3
	StrCmp $2 "" +2
	StrCmp $2 '"' 0 qloop
run:
	StrCpy $2 $1 $3 ; Path to uninstaller
	StrCpy $1 161 ; ERROR_BAD_PATHNAME
	GetFullPathName $3 "$2\.." ; $InstDir
	IfFileExists "$2" 0 +4
	ExecWait '"$2" /S _?=$3' $1 ; This assumes the existing uninstaller is a NSIS uninstaller, other uninstallers don't support /S nor _?=
	IntCmp $1 0 "" +2 +2 ; Don't delete the installer if it was aborted
	Delete "$2" ; Delete the uninstaller
	RMDir "$3" ; Try to delete $InstDir
	RMDir "$3\.." ; (Optional) Try to delete the parent of $InstDir
Pop $3
Pop $2
Exch $1 ; exitcode
FunctionEnd


Function .onInit
ReadRegStr $0 HKCU "Software\Software\Microsoft\Windows\CurrentVersion\Uninstall\${UninstId}" "UninstallString"
${If} $0 != ""
${AndIf} ${Cmd} `MessageBox MB_YESNO|MB_ICONQUESTION "Uninstall previous version?" /SD IDYES IDYES`
	!insertmacro UninstallExisting $0 $0
	${If} $0 <> 0
		MessageBox MB_YESNO|MB_ICONSTOP "Failed to uninstall, continue anyway?" /SD IDYES IDYES +2
			Abort
	${EndIf}
${EndIf}
FunctionEnd

Page Directory
Page InstFiles

Section
SetOutPath $InstDir
File "VC_redist.x64.exe"
ExecWait '"VC_redist.x64.exe" /passive /norestart'
File /r "build\PolygonLauncher\*"
WriteUninstaller "$InstDir\Uninst.exe"
WriteRegStr HKCU "Software\Software\Microsoft\Windows\CurrentVersion\Uninstall\${UninstId}" "DisplayName" "PolygonLauncher"
WriteRegStr HKCU "Software\Software\Microsoft\Windows\CurrentVersion\Uninstall\${UninstId}" "UninstallString" '"$InstDir\Uninst.exe"'
WriteRegStr HKCU "Software\Software\Microsoft\Windows\CurrentVersion\Uninstall\${UninstId}" "QuietUninstallString" '"$InstDir\Uninst.exe" /S'
CreateShortcut "$desktop\Polygon Online.lnk" "$instdir\qode.exe"
SectionEnd

Section Uninstall
RMDIR /r "$INSTDIR"
DeleteRegKey HKCU "Software\Software\Microsoft\Windows\CurrentVersion\Uninstall\${UninstId}"
Delete "$InstDir\Uninst.exe"
RMDir "$InstDir"
SectionEnd