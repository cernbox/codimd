<?php

namespace OCA\CodiMD\AppInfo;

$app = new Application();

$domains = \OC::$server->getConfig()->getSystemValue("cbox.wopi.officeonline", ['https://login.cern.ch', 'https://oos.web.cern.ch', 'https://msoo-lb.cern.ch', 'https://wopi.cernbox.cern.ch:8443', 'https://cbox-wopidev-01.cern.ch:8443', 'https://msoo-lb-dev.cern.ch']);
$policy = new \OCP\AppFramework\Http\EmptyContentSecurityPolicy();
foreach($domains as $domain) {
	$policy->addAllowedScriptDomain($domain);
	$policy->addAllowedFrameDomain($domain);
	$policy->addAllowedConnectDomain($domain);
}
\OC::$server->getContentSecurityPolicyManager()->addDefaultPolicy($policy);

\OCP\Util::addScript('codimd', 'script');
// \OCP\Util::addStyle('codimd', 'style');
