import BMF from 'browser-md5-file';



export default (file: File, cb: (pro: number) => void) =>  {
  return new Promise<string>((res, rej) => {
    const bmf = new BMF()
    bmf.md5(
      file,
      (err: any, md5: string) => {
        console.log('err:', err);
        if(!err) res(md5)
        rej(err)
      },
      (progress: any) => {
        cb(progress)
      },
    );
  })
}