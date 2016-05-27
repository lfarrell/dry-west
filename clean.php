<?php
$files = ["data/ca/ca_temp", "data/ca/ca_precip"];
/*
foreach($files as $file) {
    $fh = fopen($file . "_clean.csv", "wb");

    if (($handle = fopen($file . ".csv", "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if($data[2] != -9999) {
                fputcsv($fh, $data);
            }
        }
        fclose($handle);
    }
    fclose($fh);
} */

$stations = ["data/stations/ca_temp_stations" => "data/ca/ca_temp_clean.csv",
    "data/stations/ca_precip_stations" => "data/ca/ca_precip_clean.csv"];

foreach($stations as $station => $values) {
    $fh = fopen($station . "_clean.csv", "wb");
    $fields = file($values);

    if (($handle = fopen($station . ".csv", "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            foreach($fields as $field) {
                if(preg_match('/' . $data[0] . '/', $field)) {
                    fputcsv($fh, $data);
                    break;
                }
            }
        }
        fclose($handle);
    }
    fclose($fh);
}
