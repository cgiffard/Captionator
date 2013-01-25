#!/usr/bin/perl

# AUTOBUILD

use strict;
use Data::Dumper;

# This is useful for me since I'm often doing CI in safari.
# If this doesn't make sense to you, you may ignore this, or hell, ignore the entire script.
my $AScript = <<EOS
osascript -e '
tell application "Safari"
set windowList to windows
repeat with cWindow in windowList
	set tabList to tabs in cWindow
	repeat with cTab in tabList
		if ((the name of cTab) as string) contains "HTML5 Video Closed Captioning Example" then
			set URL of cTab to (the URL of cTab as string)
		end if
	end repeat
end repeat
end tell
';
EOS
;

my $PreviousNewestMtime = 0;

while(1) {
	my $MaxMTime = 0;

	foreach my $File (glob("./source/*.js")) {
		$MaxMTime = (stat($File))[9] unless $MaxMTime > (stat($File))[9];
	}

	if ($MaxMTime > $PreviousNewestMtime) {
		print "Source tree has been modified! Rebuilding Captionator.js...\n";
		system("jake");
		$PreviousNewestMtime = $MaxMTime;

		print "Reloading any Safari tabs...\n";
		system($AScript);


		# That's it!
		print "\n\n";
	}

	sleep 1;
}