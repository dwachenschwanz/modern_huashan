#!/usr/bin/env bash
# sudo at the beginning, so no need to enter later.
tput setaf 1; tput bold
echo "                    -~=<[ Warning ]>=~-"
tput sgr0
echo "This is the new deploy script. Use -h to see the changes."

trap "exit" INT
echo -e "
                    ____________________
                  <|                    |>
                  <|      SmartOrg      |>
                  <|    Wizard Deploy   |>
                  <|____________________|>
                           | XX |
                           | XX |
                           | XX |
                           | XX |
                           | XX |
                           | XX |
                           | XX |
                  @_@ o_o  [][][]  0_0 O_o
"
echo "*** Found hostname $HOST ***"
echo "*** Pulling from Git ***"
cd /opt/rangal/1.0.0/load/sources/huashan
git pull origin master

#echo "*** npm run build ***"
#npm run build

echo "*** Go to /opt/rangal/1.0.0/bin/wizard/Huashan/ ***"
cd /opt/rangal/1.0.0/bin/wizard/Huashan/

echo "*** Clean Contents of Huashan bin ***"
sudo rm -r /opt/rangal/1.0.0/bin/wizard/Huashan/*

echo "*** Copy From huashan dist folder ***"
sudo cp /opt/rangal/1.0.0/load/sources/huashan/dist/* . -r

echo "*** Remove Unnecessary Files ***"
sudo rm jsonview.js portfolioStructureview.js selectTemplateview.js appstructureview.js datastructureview.js loginview.js prebundle.js

sudo service httpd restart
