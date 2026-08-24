$jsFiles = Get-ChildItem -Path './js' -Recurse -Filter '*.js'
foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $content -replace 'window\.location\.href\s*=\s*([^;]+);', 'if(window.smoothRedirect){window.smoothRedirect($1);}else{window.location.href=$1;}'
    if ($updated -cne $content) {
        Set-Content -Path $file.FullName -Value $updated
    }
}
