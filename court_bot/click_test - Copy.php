<?php

set_time_limit(0);
ini_set('memory_limit', '512M');

error_reporting(E_ALL);

$results = [];



$clubs = json_decode(
    file_get_contents(
        __DIR__ . '/clubs.json'
    ),
    true
);

if (!$clubs) {
    die('clubs.json error');
}

$cookieFile = __DIR__ . '/cookies.txt';

function getPage($url, $cookieFile)
{
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,

        CURLOPT_COOKIEJAR  => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,

        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,

        CURLOPT_USERAGENT =>
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0',

        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: bg-BG,bg;q=0.9,en;q=0.8',
            'Referer: https://clickandplay.bg/'
        ]
    ]);

    $html = curl_exec($ch);

    curl_close($ch);

    return $html;
}

/*
|--------------------------------------------------------------------------
| Нова сесия
|--------------------------------------------------------------------------
*/

@unlink($cookieFile);

/*
|--------------------------------------------------------------------------
| Стъпка 1 - Home
|--------------------------------------------------------------------------
*/

getPage(
    'https://clickandplay.bg/',
    $cookieFile
);



/*
|--------------------------------------------------------------------------
| Стъпка 3 - Specific day
|--------------------------------------------------------------------------
*/

echo "<pre>";

foreach ($clubs as $club) {

getPage(
    "https://clickandplay.bg/{$club['slug']}-reservation{$club['id']}.html",
    $cookieFile
);

for ($dayOffset = 0; $dayOffset < 14; $dayOffset++) {

    $date = new DateTime();
    $date->modify("+$dayOffset day");

    $bgDate = $date->format('d.m.Y');

    $url =
"https://clickandplay.bg/{$club['slug']}-reservation-$bgDate-{$club['id']}.html";

    $html = getPage($url, $cookieFile);

if (!$html) {

    echo "EMPTY RESPONSE: $url\n";

    continue;
}

    $marker = 'var activeCourtHours = ';

    $start = strpos($html, $marker);

    if ($start === false) {

        echo "\n====================\n";
        echo "$bgDate\n";
        echo "NO DATA\n";
        echo "====================\n";

        continue;
    }

    $start += strlen($marker);

    $end = strpos(
        $html,
        '$(function ()',
        $start
    );

    if ($end === false) {
        continue;
    }

    $json = trim(
        substr(
            $html,
            $start,
            $end - $start
        )
    );

    $json = rtrim($json, ';');

    $data = json_decode($json, true);

    if (!$data) {
        continue;
    }

    echo "\n";
    echo "#########################################\n";
    echo "$bgDate\n";
    echo "#########################################\n\n";

    foreach ($data as $courtId => $slots) {

        echo "COURT $courtId\n";

        foreach ($slots as $hour => $slot) {

            if (($slot['is_busy'] ?? 1) == 0) {

$results[$club['id']][$bgDate][$courtId] ??= [
    'court_id' => $courtId,
    'slots' => []
];

$results[$club['id']][$bgDate][$courtId]['slots'][] = [
    'time'  => $hour,
    'price' => $slot['price'] ?? null
];

                echo "  $hour";

                if (isset($slot['price'])) {
                    echo " (€{$slot['price']})";
                }

                echo "\n";
            }
        }

        echo "\n";
    }
}
}

$output = [
    'generated_at' => date('Y-m-d H:i:s'),
    'clubs_info'   => $clubs,
    'clubs'        => $results
];

$jsonOutput = json_encode(
    $output,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
);

echo "\nJSON ERROR:\n";
var_dump(json_last_error_msg());

echo "\nJSON LENGTH:\n";
var_dump(strlen((string)$jsonOutput));

$result = file_put_contents(
    __DIR__ . '/clubs_data.json',
    $jsonOutput
);

echo "\nSAVE RESULT:\n";
var_dump($result);

echo "\nFILE EXISTS:\n";
var_dump(file_exists(__DIR__ . '/clubs_data.json'));


