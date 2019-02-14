<?php

// request to external server
// workaround to avoid CORS
// response as XML

$url = $_GET['url'];

$response = file_get_contents($url);

header('Content-Type: text/xml');
header('Access-Control-Allow-Origin: *');

echo $response;

?>