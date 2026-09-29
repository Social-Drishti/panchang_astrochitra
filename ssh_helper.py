import paramiko
import os
import sys
import time


def ssh_exec(command, host=None, user=None, password=None, key=None, timeout=30):
    """Execute a command on remote server via SSH.

    Credentials resolved (first non-None wins):
      1. Function argument
      2. Environment variable
      3. Built-in default (password auth only)
    """
    host = host or os.environ.get('SSH_HOST') or '64.227.188.196'
    user = user or os.environ.get('SSH_USER') or 'root'
    password = password or os.environ.get('SSH_PASSWORD')
    key = key or os.environ.get('SSH_KEY')

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        if key:
            import io
            pkey = paramiko.RSAKey.from_private_key(io.StringIO(key))
            client.connect(host, username=user, pkey=pkey, timeout=10)
        else:
            pwd = password or '@Astro#123SD'
            client.connect(host, username=user, password=pwd, timeout=10)

        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        exit_code = stdout.channel.recv_exit_status()
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")
        print(f"[Exit: {exit_code}]")
        return out, err, exit_code
    except Exception as e:
        print(f"ERROR: {e}")
        return '', str(e), 1
    finally:
        client.close()


if __name__ == '__main__':
    if len(sys.argv) > 1:
        cmd = ' '.join(sys.argv[1:])
        ssh_exec(cmd)
    else:
        print("Usage: python ssh_helper.py <command>")
