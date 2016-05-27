<?php
$ca_files = scandir('data/ca');

$fh = fopen('data/ca_all.csv', 'wb');

$i = 0;
foreach($ca_files as $file) {
    if(!is_dir($file)) {
        if (($handle = fopen("data/ca/" . $file, "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if($i = 0 || preg_match('/^\d/', $data[2])) {
                    fputcsv($fh, $data);
                    $i = 1;
                }
            }
            fclose($handle);
        }
        echo $file . " processed\n";
    }
}

fclose($fh);