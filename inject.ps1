$htmlFiles = Get-ChildItem -Path '.' -Recurse -Filter '*.html'
$transitionCode = @"
  <style>
    body { animation: pageFadeIn 0.3s ease-out forwards; }
    @keyframes pageFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .page-fade-out { opacity: 0 !important; transform: translateY(-10px) !important; transition: opacity 0.3s ease-out, transform 0.3s ease-out !important; }
  </style>
  <script>
    window.smoothRedirect = function(url) {
      document.body.classList.add('page-fade-out');
      setTimeout(() => { window.location.href = url; }, 300);
    };
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript') && this.target !== '_blank') {
            e.preventDefault();
            window.smoothRedirect(this.href);
          }
        });
      });
    });
  </script>
</head>
"@

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "pageFadeIn") {
        $content = $content -replace "</head>", $transitionCode
        Set-Content -Path $file.FullName -Value $content
    }
}
