<?php

class ControllerIndex{
	private $_system;
	private $_hat;
	private $_shoe;
	function __construct()
	{

		require_once 'libs/config_sinmapproxy.php';
		$this->_system 		= System::singleton();
		$this->_hat 		= new Hat();
		$this->_shoe 		= new Shoe();
		
		$data["baseHref"]	= $this->_system->GetBaseRef();
		$data["skin"]		= $this->_system->get('skin');
		$data['env']		= $this->_system->getEnviroment();
		$data['token']		= session_id();		//token for cross site injection
		$data['urlWMS']		= $this->_system->get('urlWMS');
		$data['urlWMSqgis']	= $this->_system->get('urlWMSqgis');

		$detect 			= new Mobile_Detect();
		$data['isMobile'] 	= ($detect->isMobile() === true && $detect->isTablet() === false)? '1' : '0';
			
		$this->_system->fShow($this->_system->get('skin')."/tpl_home_sinmapproxy.php",$data);
		
		$this->_shoe->pintaShoe();

	}
 	
}
		
new ControllerIndex();

?>