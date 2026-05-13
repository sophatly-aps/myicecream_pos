<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$diskName = config('backup.backup.destination.disks')[0];
$disk = Illuminate\Support\Facades\Storage::disk($diskName);
$backupName = config('backup.backup.name');
$files = $disk->files($backupName);

var_dump($files);
var_dump($backupName);

$backups = [];
foreach ($files as $f) {
    if (substr($f, -4) == '.zip' && $disk->exists($f)) {
        $backups[] = [
            'file_path' => $f,
            'file_name' => str_replace($backupName . '/', '', $f),
            'file_size' => $disk->size($f),
            'last_modified' => date("Y-m-d H:i:s", $disk->lastModified($f)),
        ];
    }
}
var_dump($backups);
