$htmlFiles = Get-ChildItem -Path '.' -Recurse -Filter '*.html'
$fixCode = @"
<script>
  window.addEventListener('pageshow', function (event) {
    if (event.persisted || document.body.classList.contains('page-fade-out')) {
      document.body.classList.remove('page-fade-out');
    }
  });
</script>
</head>
"@

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "window\.addEventListener\('pageshow'") {
        $content = $content -replace "</head>", $fixCode
        Set-Content -Path $file.FullName -Value $content
    }
}
