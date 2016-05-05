/* this app can be used to download files from the s3-browser server with
 * user authentication
 */

package main

import (
	"flag"
	"fmt"
	"os"
	"net/url"
	"net/http"
	"net/http/cookiejar"
	"path"
	"io"
	"io/ioutil"
)

func usage() {
	fmt.Println("s3-fetcher usage:")
	flag.PrintDefaults()
	os.Exit(-1)
}


func main() {
	user := flag.String("u", "", "user name")
	pass := flag.String("p", "", "password")
	file := flag.String("f", "", "url of file to download")

	flag.Parse()

	if *user == "" || *pass == "" || *file == "" {
		usage()
	}

	u, err := url.Parse(*file)
	if err != nil {
		fmt.Println("Error parsing file URL: ", err)
		os.Exit(-1)
	}

	fileName := path.Base(u.Path)

	cookieJar, _ := cookiejar.New(nil)

	client := &http.Client{
		Jar: cookieJar,
	}

	values := make(url.Values)
	values.Set("username", "block")
	values.Set("password", "ccu-release")

	resp, err := client.PostForm(u.Scheme + "://" + u.Host + "/login", values)

	if err != nil {
		fmt.Println("Error logging in: ", err)
		os.Exit(-1)
	}

	b, _ := ioutil.ReadAll(resp.Body)
	if string(b) == "Bad user/pass" {
		fmt.Println("Bad user name or password")
		os.Exit(-1)
	}

	resp.Body.Close()

	resp, err = client.Get(*file)

	if err != nil {
		fmt.Println("Error getting file: ", err)
		os.Exit(-1)
	}

	defer resp.Body.Close()

	// create the file

	out, err := os.Create(fileName)
	if err != nil {
		fmt.Println("Error opening output file: ", err)
		os.Exit(-1)
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		fmt.Println("Error downloading file: ", err)
	}

	fmt.Printf("download of %s completed\n", fileName)
}

