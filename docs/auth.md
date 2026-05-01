- OAuthのClient IDは以下になります。
  019d4cf4-5131-7013-a558-a03999a25318

- Universal Linkですが、https://login.lseed.app/app/lstream のURLが開かれると、伊豆丸さんのアプリが起動するように設定してください。

- 認証コードとアクセストークン取得用のPHPのプログラムをお送りします。
  認証コード取得の流れですが、下記のようにクエリパラメータを作成して、
  アプリ側からブラウザを開き、https://login.lseed.app/oauth/authorize?＜クエリパラメータ>のURLを開いてください。
  携帯で上記のURLを開くときにログインチェックが行われます。　Biztechのアカウントでログインした後に、
  https://login.lseed.app/app/lstreamにリダイレクトされ、伊豆丸さんのアプリがユニバーサルリンクで開かれます。

[認証コード取得]

    $state = Str::random(40);
    $codeVerifier = Str::random(128);

    $codeChallenge = strtr(rtrim(
        base64_encode(hash('sha256', $codeVerifier, true)), '='), '+/', '-_');

    $query = http_build_query([
        'client_id' => '019d4cf4-5131-7013-a558-a03999a25318',
        'redirect_uri' => 'https://login.lseed.app/app/lstream',
        'response_type' => 'code',
        'state' => $state,
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256',
    ]);

    redirect('https://login.lseed.app/oauth/authorize?'.$query);

    [アクセストークン取得]

    $response = Http::asForm()->post('https://login.lseed.app/oauth/token', [
        'grant_type' => 'authorization_code',
        'client_id' => '019d4cf4-5131-7013-a558-a03999a25318',
     	'code_verifier' => $codeVerifier,
        'redirect_uri' => 'https://login.lseed.app/app/lstream',
        'code' => $request->code,
    ]);

    $response->json(); <-- json構造体の中にアクセストークンが入っている
