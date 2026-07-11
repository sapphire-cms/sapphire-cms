#!jq -f

##
# Usage:
# bump-peers.jq --arg version {version}

. as $input

| .peerDependencies // {}
| keys
| map(select(startswith("@sapphire-cms/"))) as $peers

| reduce $peers[] as $peer ($input; setpath([ "peerDependencies", $peer ]; $version))
