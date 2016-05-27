<?php
$fh = fopen("data/stations/ca_stations.csv", "wb");
$stations = [];
if (($handle = fopen("data/ca_all.csv", "r")) !== FALSE) {
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        if(!in_array($data[0], $stations)) {
            fputcsv($fh, [$data[0], $data[1], $data[3], $data[4]]);
            $stations[] = $data[0];
        }
    }
    fclose($handle);
}
fclose($fh);